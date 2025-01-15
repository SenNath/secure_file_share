from django.db import models
import uuid

class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class SystemConfig(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    key = models.CharField(max_length=100, unique=True)
    value = models.JSONField()
    description = models.TextField(null=True, blank=True)
    is_encrypted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'system_config'
        verbose_name = 'System Configuration'
        verbose_name_plural = 'System Configurations'

    def __str__(self):
        return self.key

class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    action = models.CharField(max_length=50)
    actor_id = models.UUIDField(null=True)
    actor_type = models.CharField(max_length=50)
    target_id = models.UUIDField(null=True)
    target_type = models.CharField(max_length=50)
    details = models.JSONField()
    ip_address = models.GenericIPAddressField(null=True)
    user_agent = models.TextField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.action} by {self.actor_type}:{self.actor_id}"

class EncryptionKey(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    key_id = models.CharField(max_length=100, unique=True)
    encrypted_key = models.TextField()
    algorithm = models.CharField(max_length=50)
    status = models.CharField(
        max_length=20,
        choices=[
            ('active', 'Active'),
            ('rotated', 'Rotated'),
            ('compromised', 'Compromised'),
            ('retired', 'Retired'),
        ],
        default='active'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    rotated_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'encryption_keys'
        verbose_name = 'Encryption Key'
        verbose_name_plural = 'Encryption Keys'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.key_id} ({self.status})"
