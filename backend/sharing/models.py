from django.db import models
import uuid
from django.conf import settings
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from files.models import File

class FileShare(models.Model):
    class AccessLevel(models.TextChoices):
        VIEW = 'VIEW', _('View')
        EDIT = 'EDIT', _('Edit')
        FULL = 'FULL', _('Full Access')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.ForeignKey(
        File,
        on_delete=models.CASCADE,
        related_name='shares'
    )
    shared_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='shared_files'
    )
    shared_with = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_shares'
    )
    access_level = models.CharField(
        max_length=10,
        choices=AccessLevel.choices,
        default=AccessLevel.VIEW
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    last_accessed_at = models.DateTimeField(null=True, blank=True)
    is_revoked = models.BooleanField(default=False)
    revoked_at = models.DateTimeField(null=True, blank=True)
    revoked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='revoked_shares'
    )
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = _('file share')
        verbose_name_plural = _('file shares')
        unique_together = ['file', 'shared_with']
        indexes = [
            models.Index(fields=['shared_by', 'shared_with']),
            models.Index(fields=['file', 'access_level']),
        ]

    def __str__(self):
        return f"{self.file.name} shared with {self.shared_with.email}"

    def is_expired(self):
        if self.expires_at:
            return timezone.now() >= self.expires_at
        return False

    def is_active(self):
        return not (self.is_revoked or self.is_expired())

class ShareLink(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.ForeignKey(
        File,
        on_delete=models.SET_NULL,
        null=True,
        related_name='share_links'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_links'
    )
    token = models.CharField(max_length=64, unique=True)
    access_level = models.CharField(
        max_length=10,
        choices=FileShare.AccessLevel.choices,
        default=FileShare.AccessLevel.VIEW
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    max_uses = models.PositiveIntegerField(null=True, blank=True)
    current_uses = models.PositiveIntegerField(default=0)
    last_used_at = models.DateTimeField(null=True, blank=True)
    password_protected = models.BooleanField(default=False)
    password_hash = models.CharField(max_length=128, blank=True)
    is_revoked = models.BooleanField(default=False)
    revoked_at = models.DateTimeField(null=True, blank=True)
    revoked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='revoked_links'
    )
    metadata = models.JSONField(default=dict)

    class Meta:
        verbose_name = _('share link')
        verbose_name_plural = _('share links')
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['file', 'created_by']),
        ]

    def __str__(self):
        return f"Share link for {self.file.name}"

    def is_expired(self):
        return timezone.now() >= self.expires_at

    def is_active(self):
        if self.is_revoked or self.is_expired():
            return False
        if self.max_uses and self.current_uses >= self.max_uses:
            return False
        return True

class ShareLinkAccess(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    share_link = models.ForeignKey(
        ShareLink,
        on_delete=models.CASCADE,
        related_name='accesses'
    )
    accessed_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    accessed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='link_accesses'
    )
    success = models.BooleanField(default=True)
    error_message = models.TextField(blank=True)

    class Meta:
        verbose_name = _('share link access')
        verbose_name_plural = _('share link accesses')
        ordering = ['-accessed_at']
        indexes = [
            models.Index(fields=['share_link', 'accessed_at']),
            models.Index(fields=['ip_address']),
        ]

    def __str__(self):
        return f"Access to {self.share_link.file.name} at {self.accessed_at}"
