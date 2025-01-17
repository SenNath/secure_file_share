from rest_framework import serializers
from .models import File, FileVersion, FileChunk
from django.contrib.auth import get_user_model
from authentication.serializers import UserSerializer

User = get_user_model()

def format_file_size(size_in_bytes):
    """Convert size in bytes to human readable format"""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size_in_bytes < 1024.0:
            return f"{size_in_bytes:.2f} {unit}"
        size_in_bytes /= 1024.0
    return f"{size_in_bytes:.2f} PB"

class FileChunkSerializer(serializers.ModelSerializer):
    class Meta:
        model = FileChunk
        fields = [
            'id', 'file', 'chunk_number', 'size',
            'checksum', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class FileVersionSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = FileVersion
        fields = [
            'id', 'file', 'version_number', 'size',
            'checksum', 'created_at', 'created_by',
            'comment', 'metadata'
        ]
        read_only_fields = [
            'id', 'created_at', 'created_by',
            'encryption_key', 'iv', 'encrypted_path'
        ]

class FileInitializeSerializer(serializers.ModelSerializer):
    """Serializer specifically for initializing file uploads with encryption data"""
    class Meta:
        model = File
        fields = [
            'name', 'original_name', 'mime_type', 'size',
            'encrypted_path', 'encryption_key', 'iv',
            'status', 'description', 'tags', 'metadata'
        ]
        extra_kwargs = {
            'encryption_key': {'write_only': True},
            'iv': {'write_only': True},
            'encrypted_path': {'write_only': True}
        }

class FileSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    latest_version = serializers.SerializerMethodField()
    formatted_size = serializers.SerializerMethodField()
    
    class Meta:
        model = File
        fields = [
            'id', 'owner', 'name', 'original_name',
            'mime_type', 'size', 'formatted_size', 'checksum', 'status',
            'upload_started_at', 'upload_completed_at',
            'last_accessed_at', 'is_deleted', 'deleted_at',
            'description', 'tags', 'metadata', 'latest_version'
        ]
        read_only_fields = [
            'id', 'owner', 'upload_started_at',
            'upload_completed_at', 'last_accessed_at',
            'deleted_at', 'checksum', 'encryption_key',
            'iv', 'encrypted_path'
        ]

    def get_latest_version(self, obj):
        latest_version = obj.versions.first()
        if latest_version:
            return FileVersionSerializer(latest_version).data
        return None
        
    def get_formatted_size(self, obj):
        return format_file_size(obj.size)

class FileListSerializer(FileSerializer):
    """Simplified serializer for list views"""
    owner = UserSerializer(read_only=True)
    
    class Meta(FileSerializer.Meta):
        fields = [
            'id', 'name', 'mime_type', 'size', 'owner',
            'formatted_size', 'status', 'upload_completed_at',
            'last_accessed_at', 'is_deleted'
        ] 