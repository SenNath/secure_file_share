from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.http import FileResponse, HttpResponse
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os
import tempfile
from .models import File, FileVersion, FileChunk
from .serializers import (
    FileSerializer, FileListSerializer,
    FileVersionSerializer, FileChunkSerializer,
    FileInitializeSerializer
)
from .utils import (
    encrypt_file, decrypt_file, calculate_file_hash,
    get_file_size, ensure_directory_exists, clean_filename,
    get_mime_type, is_valid_file_type, generate_encryption_key,
    generate_iv
)
import uuid
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import get_user_model

class FileListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FileListSerializer

    def get_queryset(self):
        return File.objects.filter(
            owner=self.request.user,
            is_deleted=False,
            status=File.Status.COMPLETED
        ).order_by('-upload_completed_at')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return FileSerializer
        return FileListSerializer

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class FileDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FileSerializer

    def get_queryset(self):
        return File.objects.filter(owner=self.request.user)

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.deleted_at = timezone.now()
        instance.save()

class FileContentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        file = get_object_or_404(File, pk=pk, owner=request.user)
        
        try:
            file_path = file.get_file_path()
            if not default_storage.exists(file_path):
                return Response(
                    {"error": "File not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Read encrypted data
            with default_storage.open(file_path, 'rb') as f:
                encrypted_data = f.read()

            # Decrypt the data using base64-encoded values
            decrypted_data = decrypt_file(
                encrypted_data,
                file.encryption_key,
                file.iv
            )

            # Create temporary file for serving
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                temp_file.write(decrypted_data)
                temp_file.flush()

            response = FileResponse(
                open(temp_file.name, 'rb'),
                content_type=file.mime_type
            )
            response['Content-Disposition'] = f'inline; filename="{file.original_name}"'
            
            # Add security headers
            response['Content-Security-Policy'] = "default-src 'self'"
            response['X-Content-Type-Options'] = 'nosniff'
            response['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
            response['Pragma'] = 'no-cache'

            # Update last accessed time
            file.last_accessed_at = timezone.now()
            file.save()

            # Clean up temp file after response is sent
            os.unlink(temp_file.name)
            return response

        except Exception as e:
            print("Error in FileContentView:", str(e))
            import traceback
            traceback.print_exc()
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class FileDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        file = get_object_or_404(File, pk=pk, owner=request.user)
        
        try:
            file_path = file.get_file_path()
            if not default_storage.exists(file_path):
                return Response(
                    {"error": "File not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Read encrypted data
            with default_storage.open(file_path, 'rb') as f:
                encrypted_data = f.read()

            # Decrypt the data using base64-encoded values
            decrypted_data = decrypt_file(
                encrypted_data,
                file.encryption_key,
                file.iv
            )

            # Create response with decrypted data
            response = HttpResponse(decrypted_data, content_type=file.mime_type)
            response['Content-Disposition'] = f'attachment; filename="{file.original_name}"'

            # Update last accessed time
            file.last_accessed_at = timezone.now()
            file.save()

            return response

        except Exception as e:
            print("Error in FileDownloadView:", str(e))
            import traceback
            traceback.print_exc()
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class FileVersionListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FileVersionSerializer

    def get_queryset(self):
        return FileVersion.objects.filter(
            file__owner=self.request.user,
            file_id=self.kwargs['pk']
        )

class FileVersionDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FileVersionSerializer

    def get_queryset(self):
        return FileVersion.objects.filter(
            file__owner=self.request.user,
            file_id=self.kwargs['file_pk'],
            version_number=self.kwargs['version']
        )

class InitializeUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Validate file metadata
            name = clean_filename(request.data.get('name', ''))
            if not name:
                return Response(
                    {"error": "File name is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            mime_type = request.data.get('mime_type', '')
            if not is_valid_file_type(mime_type):
                return Response(
                    {"error": "Invalid file type"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Generate encryption key and unique path
            encryption_key = generate_encryption_key()
            timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
            unique_id = str(uuid.uuid4())
            
            # Create base directory path
            base_path = f"files/{request.user.id}/{timestamp}_{unique_id}"
            ensure_directory_exists(base_path)
            
            # Set encrypted path relative to base storage
            encrypted_path = f"{timestamp}_{unique_id}/{name}"

            file_data = {
                'name': name,
                'original_name': name,
                'mime_type': mime_type,
                'size': request.data.get('size', 0),
                'encryption_key': encryption_key,  # Already base64 encoded from generate_encryption_key()
                'encrypted_path': encrypted_path,
                'iv': generate_iv(),  # New utility function to generate and encode IV
                'status': File.Status.UPLOADING,
                'description': request.data.get('description', ''),
                'tags': request.data.get('tags', []),
                'metadata': request.data.get('metadata', {})
            }

            # Use the FileInitializeSerializer for creation
            serializer = FileInitializeSerializer(data=file_data)
            if serializer.is_valid():
                file = serializer.save(owner=request.user)
                # Return the response using the main FileSerializer
                return Response(
                    FileSerializer(file).data,
                    status=status.HTTP_201_CREATED
                )
            
            # If validation fails, log the errors
            print("Serializer errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            print("Error in InitializeUploadView:", str(e))
            import traceback
            traceback.print_exc()
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UploadChunkView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request, file_id):
        file = get_object_or_404(
            File,
            pk=file_id,
            owner=request.user,
            status=File.Status.UPLOADING
        )

        try:
            chunk_number = int(request.data.get('chunk_number', 0))
            chunk_data = request.FILES.get('chunk')
            
            if not chunk_data:
                return Response(
                    {"error": "Chunk data is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create a temporary file for the chunk data
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                for chunk in chunk_data.chunks():
                    temp_file.write(chunk)
                temp_file.flush()
                
                # Calculate chunk hash from the temporary file
                chunk_hash = calculate_file_hash(temp_file.name)
            
            # Create chunk record
            chunk = FileChunk.objects.create(
                file=file,
                chunk_number=chunk_number,
                size=chunk_data.size,
                checksum=chunk_hash,
                status=File.Status.COMPLETED
            )

            # Store chunk data
            chunk_path = f"chunks/{file.id}/{chunk_number}"
            ensure_directory_exists(chunk_path)
            with open(temp_file.name, 'rb') as f:
                default_storage.save(chunk_path, ContentFile(f.read()))
            
            # Clean up the temporary file
            os.unlink(temp_file.name)

            return Response(
                FileChunkSerializer(chunk).data,
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CompleteUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, file_id):
        file = get_object_or_404(
            File,
            pk=file_id,
            owner=request.user,
            status=File.Status.UPLOADING
        )

        try:
            # Verify all chunks are present
            chunks = FileChunk.objects.filter(file=file).order_by('chunk_number')
            expected_chunks = range(chunks.count())
            if not all(c.chunk_number == n for c, n in zip(chunks, expected_chunks)):
                return Response(
                    {"error": "Missing chunks"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Combine chunks and encrypt
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                for chunk in chunks:
                    chunk_path = f"chunks/{file.id}/{chunk.chunk_number}"
                    with default_storage.open(chunk_path, 'rb') as chunk_file:
                        temp_file.write(chunk_file.read())
                temp_file.flush()

                # Calculate final file hash and size
                file_hash = calculate_file_hash(temp_file.name)
                file_size = get_file_size(temp_file.name)

                # Encrypt the complete file
                encrypted_data, iv = encrypt_file(
                    temp_file.name,
                    file.encryption_key  # Pass the key directly, encrypt_file handles base64 decoding
                )

            # Save encrypted file
            file_path = file.get_file_path()
            ensure_directory_exists(file_path)
            default_storage.save(file_path, ContentFile(encrypted_data))

            # Update file record
            file.status = File.Status.COMPLETED
            file.upload_completed_at = timezone.now()
            file.size = file_size
            file.checksum = file_hash
            file.iv = iv  # IV is already base64 encoded by encrypt_file
            file.save()

            # Clean up chunks
            for chunk in chunks:
                chunk_path = f"chunks/{file.id}/{chunk.chunk_number}"
                default_storage.delete(chunk_path)
            chunks.delete()

            # Create initial version
            FileVersion.objects.create(
                file=file,
                version_number=1,
                encrypted_path=file.encrypted_path,
                encryption_key=file.encryption_key,
                iv=file.iv,
                checksum=file.checksum,
                size=file.size,
                created_by=request.user
            )

            return Response(
                FileSerializer(file).data,
                status=status.HTTP_200_OK
            )

        except Exception as e:
            file.status = File.Status.FAILED
            file.save()
            print("Error in CompleteUploadView:", str(e))
            import traceback
            traceback.print_exc()
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class FileMoveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        file = get_object_or_404(File, pk=pk, owner=request.user)
        try:
            new_name = clean_filename(request.data.get('new_name', file.name))
            
            # Update file record
            file.name = new_name
            file.save()

            return Response(
                FileSerializer(file).data,
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class FileCopyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        source_file = get_object_or_404(File, pk=pk, owner=request.user)
        try:
            # Generate new encryption key for the copy
            encryption_key = generate_encryption_key()
            
            # Create new file record
            new_file = File.objects.create(
                owner=request.user,
                name=f"Copy of {source_file.name}",
                original_name=source_file.original_name,
                mime_type=source_file.mime_type,
                size=source_file.size,
                encryption_key=encryption_key,  # Already base64 encoded from generate_encryption_key()
                status=File.Status.PROCESSING,
                description=source_file.description,
                tags=source_file.tags.copy(),
                metadata=source_file.metadata.copy()
            )

            # Read source file
            source_path = source_file.get_file_path()
            with default_storage.open(source_path, 'rb') as f:
                encrypted_data = f.read()

            # Decrypt with source key and re-encrypt with new key
            decrypted_data = decrypt_file(
                encrypted_data,
                source_file.encryption_key,
                source_file.iv
            )

            # Create temporary file for re-encryption
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                temp_file.write(decrypted_data)
                temp_file.flush()

                # Re-encrypt with new key
                encrypted_data, iv = encrypt_file(
                    temp_file.name,
                    new_file.encryption_key  # Pass key directly, encrypt_file handles base64 decoding
                )

            # Save new encrypted file
            new_file_path = new_file.get_file_path()
            ensure_directory_exists(new_file_path)
            default_storage.save(new_file_path, ContentFile(encrypted_data))

            # Update new file record
            new_file.status = File.Status.COMPLETED
            new_file.iv = iv  # IV is already base64 encoded by encrypt_file
            new_file.checksum = calculate_file_hash(temp_file.name)
            new_file.upload_completed_at = timezone.now()
            new_file.save()

            # Clean up
            os.unlink(temp_file.name)

            # Create initial version
            FileVersion.objects.create(
                file=new_file,
                version_number=1,
                encrypted_path=new_file.encrypted_path,
                encryption_key=new_file.encryption_key,
                iv=new_file.iv,
                checksum=new_file.checksum,
                size=new_file.size,
                created_by=request.user,
                comment=f"Initial version (copied from {source_file.name})"
            )

            return Response(
                FileSerializer(new_file).data,
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            print("Error in FileCopyView:", str(e))
            import traceback
            traceback.print_exc()
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class FileRestoreView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        file = get_object_or_404(File, pk=pk, owner=request.user, is_deleted=True)
        file.is_deleted = False
        file.deleted_at = None
        file.save()
        return Response(
            FileSerializer(file).data,
            status=status.HTTP_200_OK
        )

class BulkDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        file_ids = request.data.get('file_ids', [])
        files = File.objects.filter(
            id__in=file_ids,
            owner=request.user,
            is_deleted=False
        )
        now = timezone.now()
        files.update(is_deleted=True, deleted_at=now)
        return Response(status=status.HTTP_200_OK)

class BulkMoveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        file_ids = request.data.get('file_ids', [])
        new_names = request.data.get('new_names', {})
        
        try:
            files = File.objects.filter(
                id__in=file_ids,
                owner=request.user,
                is_deleted=False
            )

            updated_files = []
            for file in files:
                if str(file.id) in new_names:
                    file.name = clean_filename(new_names[str(file.id)])
                    file.save()
                    updated_files.append(file)

            return Response(
                FileListSerializer(updated_files, many=True).data,
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class BulkCopyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        file_ids = request.data.get('file_ids', [])
        
        try:
            source_files = File.objects.filter(
                id__in=file_ids,
                owner=request.user,
                is_deleted=False
            )

            copied_files = []
            for source_file in source_files:
                # Generate new encryption key
                encryption_key = generate_encryption_key()
                
                # Create new file record
                new_file = File.objects.create(
                    owner=request.user,
                    name=f"Copy of {source_file.name}",
                    original_name=source_file.original_name,
                    mime_type=source_file.mime_type,
                    size=source_file.size,
                    encryption_key=encryption_key,  # Already base64 encoded from generate_encryption_key()
                    status=File.Status.PROCESSING,
                    description=source_file.description,
                    tags=source_file.tags.copy(),
                    metadata=source_file.metadata.copy()
                )

                # Read and decrypt source file
                source_path = source_file.get_file_path()
                with default_storage.open(source_path, 'rb') as f:
                    encrypted_data = f.read()

                decrypted_data = decrypt_file(
                    encrypted_data,
                    source_file.encryption_key,
                    source_file.iv
                )

                # Re-encrypt with new key
                with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                    temp_file.write(decrypted_data)
                    temp_file.flush()

                    encrypted_data, iv = encrypt_file(
                        temp_file.name,
                        new_file.encryption_key  # Pass key directly, encrypt_file handles base64 decoding
                    )

                # Save new encrypted file
                new_file_path = new_file.get_file_path()
                ensure_directory_exists(new_file_path)
                default_storage.save(new_file_path, ContentFile(encrypted_data))

                # Update new file record
                new_file.status = File.Status.COMPLETED
                new_file.iv = iv  # IV is already base64 encoded by encrypt_file
                new_file.checksum = calculate_file_hash(temp_file.name)
                new_file.upload_completed_at = timezone.now()
                new_file.save()

                # Clean up
                os.unlink(temp_file.name)

                # Create initial version
                FileVersion.objects.create(
                    file=new_file,
                    version_number=1,
                    encrypted_path=new_file.encrypted_path,
                    encryption_key=new_file.encryption_key,
                    iv=new_file.iv,
                    checksum=new_file.checksum,
                    size=new_file.size,
                    created_by=request.user,
                    comment=f"Initial version (copied from {source_file.name})"
                )

                copied_files.append(new_file)

            return Response(
                FileListSerializer(copied_files, many=True).data,
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class FileSearchView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FileListSerializer

    def get_queryset(self):
        query = self.request.query_params.get('q', '')
        return File.objects.filter(
            owner=self.request.user,
            is_deleted=False,
            name__icontains=query
        )

class RecentFilesView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FileListSerializer

    def get_queryset(self):
        return File.objects.filter(
            owner=self.request.user,
            is_deleted=False
        ).order_by('-updated_at')[:10]

class TrashView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FileListSerializer

    def get_queryset(self):
        return File.objects.filter(
            owner=self.request.user,
            is_deleted=True
        )
