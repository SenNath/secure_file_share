from django.db import models
import uuid
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class File(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', _('Pending')
        UPLOADING = 'UPLOADING', _('Uploading')
        PROCESSING = 'PROCESSING', _('Processing')
        COMPLETED = 'COMPLETED', _('Completed')
        FAILED = 'FAILED', _('Failed')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='files'
    )
    name = models.CharField(max_length=255)
    original_name = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=255)
    size = models.BigIntegerField()
    encrypted_path = models.CharField(max_length=255, unique=True)
    encryption_key = models.CharField(max_length=64)  # Store encrypted key
    iv = models.CharField(max_length=32)  # Initialization vector
    checksum = models.CharField(max_length=64)  # SHA-256 hash
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    upload_started_at = models.DateTimeField(auto_now_add=True)
    upload_completed_at = models.DateTimeField(null=True, blank=True)
    last_accessed_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    description = models.TextField(blank=True)
    tags = models.JSONField(default=list)
    metadata = models.JSONField(default=dict)

    class Meta:
        verbose_name = _('file')
        verbose_name_plural = _('files')
        ordering = ['-upload_started_at']
        indexes = [
            models.Index(fields=['owner', 'status']),
            models.Index(fields=['upload_started_at']),
            models.Index(fields=['name']),
        ]

    def __str__(self):
        return f"{self.name} ({self.id})"

    def get_file_path(self):
        """Returns the full path to the encrypted file."""
        return f"files/{self.owner.id}/{self.encrypted_path}"

class FileChunk(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.ForeignKey(
        File,
        on_delete=models.CASCADE,
        related_name='chunks'
    )
    chunk_number = models.PositiveIntegerField()
    size = models.PositiveIntegerField()
    checksum = models.CharField(max_length=64)  # SHA-256 hash
    status = models.CharField(
        max_length=20,
        choices=File.Status.choices,
        default=File.Status.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['file', 'chunk_number']
        ordering = ['chunk_number']
        verbose_name = _('file chunk')
        verbose_name_plural = _('file chunks')

    def __str__(self):
        return f"Chunk {self.chunk_number} of {self.file.name}"

class FileVersion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.ForeignKey(
        File,
        on_delete=models.CASCADE,
        related_name='versions'
    )
    version_number = models.PositiveIntegerField()
    encrypted_path = models.CharField(max_length=255, unique=True)
    encryption_key = models.CharField(max_length=64)  # Store encrypted key
    iv = models.CharField(max_length=32)  # Initialization vector
    checksum = models.CharField(max_length=64)  # SHA-256 hash
    size = models.BigIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='file_versions'
    )
    comment = models.TextField(blank=True)
    metadata = models.JSONField(default=dict)

    class Meta:
        unique_together = ['file', 'version_number']
        ordering = ['-version_number']
        verbose_name = _('file version')
        verbose_name_plural = _('file versions')

    def __str__(self):
        return f"{self.file.name} v{self.version_number}"

    def get_file_path(self):
        """Returns the full path to the encrypted version file."""
        return f"files/{self.file.owner.id}/versions/{self.encrypted_path}"
