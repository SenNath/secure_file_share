from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.crypto import get_random_string
from django.http import FileResponse, HttpResponse
from .models import FileShare, ShareLink, ShareLinkAccess
from files.models import File
from .serializers import FileShareSerializer, ShareLinkSerializer, ShareLinkAccessSerializer
import secrets
import hashlib

class CreateShareView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FileShareSerializer

    def post(self, request, file_id):
        file = get_object_or_404(File, id=file_id, owner=request.user)
        serializer = self.serializer_class(data=request.data)
        
        if serializer.is_valid():
            serializer.save(
                file=file,
                shared_by=request.user
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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

        # Handle file download logic here
        file_path = share_link.file.file.path
        response = FileResponse(open(file_path, 'rb'))
        response['Content-Disposition'] = f'attachment; filename="{share_link.file.name}"'
        return response

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
