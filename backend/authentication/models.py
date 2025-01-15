import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, AbstractUser
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.base_user import BaseUserManager

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email field must be set'))
        email = self.normalize_email(email)
        
        # If username is not provided, use the part before @ in email
        if 'username' not in extra_fields or not extra_fields['username']:
            extra_fields['username'] = email.split('@')[0]
            
        # Ensure username is unique by appending a number if necessary
        base_username = extra_fields['username']
        counter = 1
        while self.model.objects.filter(username=extra_fields['username']).exists():
            extra_fields['username'] = f"{base_username}{counter}"
            counter += 1
            
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        # Get or create ADMIN role
        admin_role, _ = Role.objects.get_or_create(
            name=Role.ADMIN,
            defaults={
                'permissions': {
                    'permissions': [
                        'manage_users',
                        'manage_roles',
                        'manage_files',
                        'view_audit_logs',
                        'manage_system_settings'
                    ]
                }
            }
        )
        extra_fields['role'] = admin_role

        return self.create_user(email, password, **extra_fields)

class Role(models.Model):
    ADMIN = 'ADMIN'
    REGULAR = 'REGULAR'
    GUEST = 'GUEST'
    
    ROLE_CHOICES = [
        (ADMIN, 'Admin'),
        (REGULAR, 'Regular'),
        (GUEST, 'Guest'),
    ]
    
    name = models.CharField(max_length=50, choices=ROLE_CHOICES, unique=True)
    permissions = models.JSONField(default=dict)
    
    def __str__(self):
        return self.name

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(_('username'), max_length=150, unique=True, null=True, blank=True)
    email = models.EmailField(_('email address'), unique=True)
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True)
    mfa_enabled = models.BooleanField(default=False)
    mfa_secret = models.CharField(max_length=32, null=True, blank=True)
    mfa_backup_codes = models.JSONField(default=list)
    email_verified = models.BooleanField(default=False)
    verification_token = models.CharField(max_length=64, null=True, blank=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    failed_login_attempts = models.PositiveIntegerField(default=0)
    last_failed_login = models.DateTimeField(null=True, blank=True)
    password_changed_at = models.DateTimeField(null=True, blank=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    def has_permission(self, permission):
        if not self.role:
            return False
        return permission in self.role.permissions.get('permissions', [])

class MFADevice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mfa_devices')
    name = models.CharField(max_length=50)
    type = models.CharField(
        max_length=20,
        choices=[
            ('totp', 'TOTP'),
            ('sms', 'SMS'),
            ('email', 'Email'),
        ]
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'mfa_devices'
        verbose_name = 'MFA Device'
        verbose_name_plural = 'MFA Devices'

    def __str__(self):
        return f"{self.user.email} - {self.type}"

class LoginAttempt(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_attempts')
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=[
            ('success', 'Success'),
            ('failed', 'Failed'),
            ('blocked', 'Blocked'),
        ]
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'login_attempts'
        verbose_name = 'Login Attempt'
        verbose_name_plural = 'Login Attempts'

    def __str__(self):
        return f"{self.user.email} - {self.status} - {self.created_at}"
