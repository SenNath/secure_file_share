from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.crypto import get_random_string
from django.http import FileResponse, HttpResponse
from django.conf import settings
from django.contrib.auth import get_user_model
import os
from .models import FileShare, ShareLink, ShareLinkAccess
from files.models import File
from .serializers import FileShareSerializer, ShareLinkSerializer, ShareLinkAccessSerializer
import secrets
import hashlib
import mimetypes
import tempfile
from files.utils import decrypt_file

User = get_user_model()

class CreateShareView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FileShareSerializer

    def post(self, request, file_id):
        file = get_object_or_404(File, id=file_id, owner=request.user)
        serializer = self.serializer_class(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        # Now that serializer is validated, we can safely access validated_data
        shared_with_email = serializer.validated_data.get('shared_with_email')
        if not shared_with_email:
            return Response(
                {"error": "shared_with_email field is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            shared_with_user = User.objects.get(email=shared_with_email)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found with this email"}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if a share already exists for this file and user
        existing_share = FileShare.objects.filter(
            file=file,
            shared_with=shared_with_user,
            is_revoked=False
        ).first()

        if existing_share:
            # Update existing share with new data
            for attr, value in serializer.validated_data.items():
                if attr != 'shared_with_email':  # Skip the email field
                    setattr(existing_share, attr, value)
            existing_share.shared_by = request.user
            existing_share.shared_at = timezone.now()
            existing_share.save()
            return Response(
                self.serializer_class(existing_share).data,
                status=status.HTTP_200_OK
            )
        
        # Create new share if no existing share found
        serializer.save(
            file=file,
            shared_by=request.user,
            shared_with=shared_with_user
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class FileShareListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FileShareSerializer

    def get_queryset(self):
        return FileShare.objects.filter(
            file_id=self.kwargs['file_id'],
            file__owner=self.request.user,
            is_revoked=False
        )

class ShareDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FileShareSerializer

    def get_queryset(self):
        return FileShare.objects.filter(
            file__owner=self.request.user
        )

    def perform_destroy(self, instance):
        instance.is_revoked = True
        instance.revoked_at = timezone.now()
        instance.revoked_by = self.request.user
        instance.save()

class ShareLinkListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ShareLinkSerializer

    def get_queryset(self):
        return ShareLink.objects.filter(
            file_id=self.kwargs['file_id'],
            created_by=self.request.user,
            is_revoked=False
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        file = get_object_or_404(File, id=self.kwargs['file_id'], owner=self.request.user)
        token = get_random_string(32)
        
        # Hash password if provided
        password = self.request.data.get('password')
        password_hash = ''
        if password:
            password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        serializer.save(
            file=file,
            created_by=self.request.user,
            token=token,
            password_hash=password_hash,
            password_protected=bool(password)
        )

class ShareLinkDetailView(generics.RetrieveDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ShareLinkSerializer

    def get_queryset(self):
        return ShareLink.objects.filter(
            created_by=self.request.user
        )

    def perform_destroy(self, instance):
        instance.is_revoked = True
        instance.revoked_at = timezone.now()
        instance.revoked_by = self.request.user
        instance.save()

class PublicShareLinkView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        share_link = get_object_or_404(ShareLink, token=token)
        
        if not share_link.is_active():
            return Response(
                {"error": "This share link has expired or been revoked"},
                status=status.HTTP_403_FORBIDDEN
            )

        if share_link.max_uses and share_link.current_uses >= share_link.max_uses:
            return Response(
                {"error": "This share link has reached its maximum uses"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Record access
        ShareLinkAccess.objects.create(
            share_link=share_link,
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT'),
            accessed_by=request.user if request.user.is_authenticated else None
        )

        share_link.current_uses += 1
        share_link.last_used_at = timezone.now()
        share_link.save()

        serializer = ShareLinkSerializer(share_link)
        return Response(serializer.data)

class PublicShareDownloadView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        share_link = get_object_or_404(ShareLink, token=token)
        
        if not share_link.is_active():
            return Response(
                {"error": "This share link has expired or been revoked"},
                status=status.HTTP_403_FORBIDDEN
            )

        if share_link.password_protected:
            session_verified = request.session.get(f'share_link_{token}_verified')
            if not session_verified:
                return Response(
                    {"error": "Password verification required"},
                    status=status.HTTP_403_FORBIDDEN
                )

        # Check access level
        if share_link.access_level == 'VIEW':
            return Response(
                {"error": "This link is view-only and does not allow downloads"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Handle file download logic here
        relative_path = share_link.file.get_file_path()
        file_path = os.path.join(settings.MEDIA_ROOT, relative_path)
        
        if not os.path.exists(file_path):
            return Response(
                {"error": "File not found"},
                status=status.HTTP_404_NOT_FOUND
            )
            
        try:
            # Read and decrypt the file
            with open(file_path, 'rb') as f:
                encrypted_data = f.read()
                
            decrypted_data = decrypt_file(
                encrypted_data,
                share_link.file.encryption_key,
                share_link.file.iv
            )
            
            # Create a temporary file for the decrypted content
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                temp_file.write(decrypted_data)
                temp_file_path = temp_file.name
            
            try:
                response = FileResponse(open(temp_file_path, 'rb'))
                response['Content-Disposition'] = f'attachment; filename="{share_link.file.name}"'
                return response
            finally:
                # Clean up the temporary file
                os.unlink(temp_file_path)
                
        except Exception as e:
            return Response(
                {"error": "Failed to process file"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class VerifySharePasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, token):
        share_link = get_object_or_404(ShareLink, token=token)
        password = request.data.get('password')
        
        if not password:
            return Response(
                {"error": "Password is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        password_hash = hashlib.sha256(password.encode()).hexdigest()
        if password_hash != share_link.password_hash:
            return Response(
                {"error": "Invalid password"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Store verification in session
        request.session[f'share_link_{token}_verified'] = True
        return Response({"message": "Password verified successfully"})

class SharedWithMeView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FileShareSerializer

    def get_queryset(self):
        return FileShare.objects.filter(
            shared_with=self.request.user,
            is_revoked=False
        ).exclude(expires_at__lt=timezone.now())

class MySharesView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FileShareSerializer

    def get_queryset(self):
        return FileShare.objects.filter(
            shared_by=self.request.user,
            is_revoked=False
        ).exclude(expires_at__lt=timezone.now())

class ShareAccessLogsView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ShareLinkAccessSerializer

    def get_queryset(self):
        return ShareLinkAccess.objects.filter(
            share_link_id=self.kwargs['share_id'],
            share_link__created_by=self.request.user
        )

class PublicShareViewView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        share_link = get_object_or_404(ShareLink, token=token)
        
        if not share_link.is_active():
            return Response(
                {"error": "This share link has expired or been revoked"},
                status=status.HTTP_403_FORBIDDEN
            )

        if share_link.password_protected:
            session_verified = request.session.get(f'share_link_{token}_verified')
            if not session_verified:
                return Response(
                    {"error": "Password verification required"},
                    status=status.HTTP_403_FORBIDDEN
                )

        # Handle file viewing logic here
        relative_path = share_link.file.get_file_path()
        file_path = os.path.join(settings.MEDIA_ROOT, relative_path)
        
        if not os.path.exists(file_path):
            return Response(
                {"error": "File not found"},
                status=status.HTTP_404_NOT_FOUND
            )
            
        try:
            # Read and decrypt the file
            with open(file_path, 'rb') as f:
                encrypted_data = f.read()
            
            decrypted_data = decrypt_file(
                encrypted_data,
                share_link.file.encryption_key,
                share_link.file.iv
            )
            
            # Create a temporary file for the decrypted content
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                temp_file.write(decrypted_data)
                temp_file_path = temp_file.name
            
            try:
                content_type, _ = mimetypes.guess_type(share_link.file.name)
                if not content_type:
                    content_type = 'application/octet-stream'
                    
                response = FileResponse(
                    open(temp_file_path, 'rb'),
                    content_type=content_type
                )


                response['Content-Disposition'] = f'inline; filename="{share_link.file.name}"'

                return response
            finally:
                # Clean up the temporary file
                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)
                
        except Exception as e:
            print(f"Error in PublicShareViewView: {str(e)}")
            return Response(
                {"error": "Failed to process file"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PublicShareViewOnlyView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        share_link = get_object_or_404(ShareLink, token=token)
        
        if not share_link.is_active():
            return Response(
                {"error": "This share link has expired or been revoked"},
                status=status.HTTP_403_FORBIDDEN
            )

        if share_link.password_protected:
            session_verified = request.session.get(f'share_link_{token}_verified')
            if not session_verified:
                return Response(
                    {"error": "Password verification required"},
                    status=status.HTTP_403_FORBIDDEN
                )

        # Get the file
        relative_path = share_link.file.get_file_path()
        file_path = os.path.join(settings.MEDIA_ROOT, relative_path)
        
        if not os.path.exists(file_path):
            return Response(
                {"error": "File not found"},
                status=status.HTTP_404_NOT_FOUND
            )
            
        try:
            # Read and decrypt the file
            with open(file_path, 'rb') as f:
                encrypted_data = f.read()
                
            decrypted_data = decrypt_file(
                encrypted_data,
                share_link.file.encryption_key,
                share_link.file.iv
            )
            
            # Create a temporary file for the decrypted content
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                temp_file.write(decrypted_data)
                temp_file_path = temp_file.name
            
            try:
                response = FileResponse(
                    open(temp_file_path, 'rb'),
                    content_type=share_link.file.mime_type
                )
                
                # Set headers to prevent download
                response['Content-Disposition'] = 'inline'
                response['Content-Security-Policy'] = "default-src 'self'; object-src 'none'"
                response['X-Content-Type-Options'] = 'nosniff'
                response['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
                response['Pragma'] = 'no-cache'
                response['X-Frame-Options'] = 'SAMEORIGIN'
                
                # Additional headers to prevent download
                response['X-Download-Options'] = 'noopen'
                response['X-Permitted-Cross-Domain-Policies'] = 'none'
                
                return response
            finally:
                # Clean up the temporary file
                os.unlink(temp_file_path)
                
        except Exception as e:
            return Response(
                {"error": "Failed to process file"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ShareDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        # Get the share and verify the user has access
        share = get_object_or_404(FileShare, pk=pk)
        if share.shared_with != request.user:
            return Response({"detail": "You don't have access to this share"}, status=status.HTTP_403_FORBIDDEN)
        
        if share.access_level != 'FULL':
            return Response({"detail": "You don't have download permission"}, status=status.HTTP_403_FORBIDDEN)
        
        if share.is_expired():
            return Response({"detail": "This share has expired"}, status=status.HTTP_403_FORBIDDEN)

        # Get the file and decrypt it
        file_obj = share.file
        relative_path = file_obj.get_file_path()
        file_path = os.path.join(settings.MEDIA_ROOT, relative_path)
        
        if not os.path.exists(file_path):
            return Response({"detail": "File not found"}, status=status.HTTP_404_NOT_FOUND)

        # Decrypt the file
        try:
            with open(file_path, 'rb') as f:
                encrypted_data = f.read()
            decrypted_data = decrypt_file(encrypted_data, file_obj.encryption_key, file_obj.iv)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Update last accessed timestamp
        share.last_accessed = timezone.now()
        share.save()

        # Prepare the response
        content_type = mimetypes.guess_type(file_obj.name)[0]
        if not content_type:
            content_type = 'application/octet-stream'
        response = HttpResponse(decrypted_data, content_type=content_type)
        response['Content-Disposition'] = f'attachment; filename="{file_obj.name}"'
        return response

class ShareViewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        # Get the share and verify the user has access
        share = get_object_or_404(FileShare, pk=pk)
        if share.shared_with != request.user:
            return Response({"detail": "You don't have access to this share"}, status=status.HTTP_403_FORBIDDEN)
        
        if share.is_expired():
            return Response({"detail": "This share has expired"}, status=status.HTTP_403_FORBIDDEN)

        # Get the file and decrypt it
        file_obj = share.file
        relative_path = file_obj.get_file_path()
        file_path = os.path.join(settings.MEDIA_ROOT, relative_path)
        
        if not os.path.exists(file_path):
            return Response({"detail": "File not found"}, status=status.HTTP_404_NOT_FOUND)

        # Decrypt the file
        try:
            with open(file_path, 'rb') as f:
                encrypted_data = f.read()
            decrypted_data = decrypt_file(encrypted_data, file_obj.encryption_key, file_obj.iv)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Update last accessed timestamp
        share.last_accessed = timezone.now()
        share.save()

        # Prepare the response
        content_type = mimetypes.guess_type(file_obj.name)[0]
        if not content_type:
            content_type = 'application/octet-stream'
        response = HttpResponse(decrypted_data, content_type=content_type)
        response['Content-Disposition'] = f'inline; filename="{file_obj.name}"'
        
        # Add security headers for full access
        response['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        response['Pragma'] = 'no-cache'
        response['X-Content-Type-Options'] = 'nosniff'
        return response

class ShareViewOnlyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        # Get the share and verify the user has access
        share = get_object_or_404(FileShare, pk=pk)
        if share.shared_with != request.user:
            return Response({"detail": "You don't have access to this share"}, status=status.HTTP_403_FORBIDDEN)
        
        if share.is_expired():
            return Response({"detail": "This share has expired"}, status=status.HTTP_403_FORBIDDEN)

        # Get the file and decrypt it
        file_obj = share.file
        relative_path = file_obj.get_file_path()
        file_path = os.path.join(settings.MEDIA_ROOT, relative_path)
        
        if not os.path.exists(file_path):
            return Response({"detail": "File not found"}, status=status.HTTP_404_NOT_FOUND)

        # Decrypt the file
        try:
            with open(file_path, 'rb') as f:
                encrypted_data = f.read()
            decrypted_data = decrypt_file(encrypted_data, file_obj.encryption_key, file_obj.iv)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Update last accessed timestamp
        share.last_accessed = timezone.now()
        share.save()

        # Prepare the response
        content_type = mimetypes.guess_type(file_obj.name)[0]
        if not content_type:
            content_type = 'application/octet-stream'
        response = HttpResponse(decrypted_data, content_type=content_type)
        response['Content-Disposition'] = f'inline; filename="{file_obj.name}"'
        
        # Add security headers for view-only access
        response['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        response['Pragma'] = 'no-cache'
        response['X-Content-Type-Options'] = 'nosniff'
        response['Content-Security-Policy'] = "default-src 'self'; object-src 'none'"
        response['X-Frame-Options'] = 'SAMEORIGIN'
        response['X-Download-Options'] = 'noopen'
        response['X-Permitted-Cross-Domain-Policies'] = 'none'
        return response
