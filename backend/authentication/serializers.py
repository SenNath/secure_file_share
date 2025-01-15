from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import MFADevice, Role

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField()
    role_name = serializers.CharField(source='role.name', read_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role', 'role_name', 'mfa_enabled', 'email_verified', 'permissions')
        read_only_fields = ('id', 'mfa_enabled', 'email_verified', 'permissions')

    def get_permissions(self, obj):
        if obj.role:
            return obj.role.permissions.get('permissions', [])
        return []

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    username = serializers.CharField(required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class MFADeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = MFADevice
        fields = ('id', 'name', 'type', 'is_active', 'created_at', 'last_used_at')
        read_only_fields = ('id', 'created_at', 'last_used_at')

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ('id', 'name', 'permissions')
        read_only_fields = ('id',)

class AdminUserSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role.name', read_only=True)
    last_login_date = serializers.DateTimeField(source='last_login', read_only=True)
    
    class Meta:
        model = User
        fields = (
            'id', 
            'email', 
            'first_name', 
            'last_name', 
            'role',
            'role_name', 
            'is_active',
            'mfa_enabled',
            'email_verified',
            'last_login_date',
            'date_joined'
        )
        read_only_fields = ('id', 'email', 'date_joined', 'last_login_date') 