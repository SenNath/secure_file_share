# Generated by Django 4.2.17 on 2025-01-10 20:23

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="File",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("name", models.CharField(max_length=255)),
                ("original_name", models.CharField(max_length=255)),
                ("size", models.BigIntegerField()),
                ("mime_type", models.CharField(max_length=100)),
                ("encryption_key", models.CharField(max_length=255)),
                ("encryption_iv", models.CharField(max_length=32)),
                ("encrypted_path", models.CharField(max_length=255)),
                ("checksum", models.CharField(max_length=64)),
                ("is_deleted", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                (
                    "owner",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="files",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "File",
                "verbose_name_plural": "Files",
                "db_table": "files",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="FileVersion",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("version_number", models.IntegerField()),
                ("encryption_key", models.CharField(max_length=255)),
                ("encryption_iv", models.CharField(max_length=32)),
                ("encrypted_path", models.CharField(max_length=255)),
                ("size", models.BigIntegerField()),
                ("checksum", models.CharField(max_length=64)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "file",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="versions",
                        to="files.file",
                    ),
                ),
            ],
            options={
                "verbose_name": "File Version",
                "verbose_name_plural": "File Versions",
                "db_table": "file_versions",
                "ordering": ["-version_number"],
                "unique_together": {("file", "version_number")},
            },
        ),
        migrations.CreateModel(
            name="FileChunk",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("chunk_number", models.IntegerField()),
                ("encryption_key", models.CharField(max_length=255)),
                ("encryption_iv", models.CharField(max_length=32)),
                ("encrypted_path", models.CharField(max_length=255)),
                ("size", models.IntegerField()),
                ("checksum", models.CharField(max_length=64)),
                ("is_uploaded", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "file",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="chunks",
                        to="files.file",
                    ),
                ),
            ],
            options={
                "verbose_name": "File Chunk",
                "verbose_name_plural": "File Chunks",
                "db_table": "file_chunks",
                "ordering": ["chunk_number"],
                "unique_together": {("file", "chunk_number")},
            },
        ),
    ]
