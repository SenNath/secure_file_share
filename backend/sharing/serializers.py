from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import FileShare, ShareLink, ShareLinkAccess
from files.serializers import FileSerializer

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email']

class FileShareSerializer(serializers.ModelSerializer):
    file = FileSerializer(read_only=True)
    shared_by = UserSerializer(read_only=True)
    shared_with = UserSerializer(read_only=True)
    shared_with_email = serializers.EmailField(write_only=True)

    class Meta:
        model = FileShare
        fields = [
            'id', 'file', 'shared_by', 'shared_with', 'shared_with_email',
            'access_level', 'created_at', 'expires_at', 'last_accessed_at',
            'is_revoked', 'revoked_at', 'notes'
        ]
        read_only_fields = ['id', 'created_at', 'last_accessed_at', 'is_revoked', 'revoked_at']

    def create(self, validated_data):
        shared_with_email = validated_data.pop('shared_with_email')
        try:
            shared_with = User.objects.get(email=shared_with_email)
        except User.DoesNotExist:
            raise serializers.ValidationError({"shared_with_email": "User not found"})
        
        validated_data['shared_with'] = shared_with
        return super().create(validated_data)

class ShareLinkSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    file = FileSerializer(read_only=True)
    share_url = serializers.SerializerMethodField()

    class Meta:
        model = ShareLink
        fields = [
            'id', 'file', 'created_by', 'token', 'access_level',
            'created_at', 'expires_at', 'max_uses', 'current_uses',
            'last_used_at', 'password_protected', 'is_revoked',
            'revoked_at', 'metadata', 'share_url'
        ]
        read_only_fields = [
            'id', 'token', 'created_at', 'current_uses',
            'last_used_at', 'is_revoked', 'revoked_at', 'share_url'
        ]

    def get_share_url(self, obj):
        request = self.context.get('request')
        if request is None:
            return None
        return f"{request.scheme}://{request.get_host()}/share/{obj.token}"

class ShareLinkAccessSerializer(serializers.ModelSerializer):
    accessed_by = UserSerializer(read_only=True)

    class Meta:
        model = ShareLinkAccess
        fields = [
            'id', 'share_link', 'accessed_at', 'ip_address',
            'user_agent', 'accessed_by', 'success', 'error_message'
        ]
        read_only_fields = ['id', 'accessed_at'] 