# Generated by Django 4.2.7 on 2025-01-10 22:22

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("files", "0002_alter_file_options_alter_filechunk_options_and_more"),
        ("sharing", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="ShareLinkAccess",
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
                ("accessed_at", models.DateTimeField(auto_now_add=True)),
                ("ip_address", models.GenericIPAddressField()),
                ("user_agent", models.TextField()),
                ("success", models.BooleanField(default=True)),
                ("error_message", models.TextField(blank=True)),
            ],
            options={
                "verbose_name": "share link access",
                "verbose_name_plural": "share link accesses",
                "ordering": ["-accessed_at"],
            },
        ),
        migrations.RemoveField(
            model_name="shareaccess",
            name="accessed_by",
        ),
        migrations.RemoveField(
            model_name="shareaccess",
            name="share",
        ),
        migrations.AlterModelOptions(
            name="fileshare",
            options={
                "verbose_name": "file share",
                "verbose_name_plural": "file shares",
            },
        ),
        migrations.AlterModelOptions(
            name="sharelink",
            options={
                "verbose_name": "share link",
                "verbose_name_plural": "share links",
            },
        ),
        migrations.RenameField(
            model_name="sharelink",
            old_name="is_one_time",
            new_name="is_revoked",
        ),
        migrations.RenameField(
            model_name="sharelink",
            old_name="last_accessed_at",
            new_name="last_used_at",
        ),
        migrations.RenameField(
            model_name="sharelink",
            old_name="is_used",
            new_name="password_protected",
        ),
        migrations.RemoveField(
            model_name="sharelink",
            name="file_share",
        ),
        migrations.AddField(
            model_name="fileshare",
            name="is_revoked",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="fileshare",
            name="last_accessed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="fileshare",
            name="notes",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="fileshare",
            name="revoked_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="fileshare",
            name="revoked_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="revoked_shares",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="sharelink",
            name="access_level",
            field=models.CharField(
                choices=[("VIEW", "View"), ("EDIT", "Edit"), ("FULL", "Full Access")],
                default="VIEW",
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="sharelink",
            name="created_by",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="created_links",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="sharelink",
            name="current_uses",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="sharelink",
            name="file",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="share_links",
                to="files.file",
            ),
        ),
        migrations.AddField(
            model_name="sharelink",
            name="max_uses",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="sharelink",
            name="metadata",
            field=models.JSONField(default=dict),
        ),
        migrations.AddField(
            model_name="sharelink",
            name="revoked_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="sharelink",
            name="revoked_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="revoked_links",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name="fileshare",
            name="access_level",
            field=models.CharField(
                choices=[("VIEW", "View"), ("EDIT", "Edit"), ("FULL", "Full Access")],
                default="VIEW",
                max_length=10,
            ),
        ),
        migrations.AlterField(
            model_name="fileshare",
            name="shared_with",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="received_shares",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name="sharelink",
            name="password_hash",
            field=models.CharField(blank=True, max_length=128),
        ),
        migrations.AlterField(
            model_name="sharelink",
            name="token",
            field=models.CharField(max_length=64, unique=True),
        ),
        migrations.AlterUniqueTogether(
            name="fileshare",
            unique_together={("file", "shared_with")},
        ),
        migrations.AddIndex(
            model_name="fileshare",
            index=models.Index(
                fields=["shared_by", "shared_with"],
                name="sharing_fil_shared__85042f_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="fileshare",
            index=models.Index(
                fields=["file", "access_level"], name="sharing_fil_file_id_a843bb_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="sharelink",
            index=models.Index(fields=["token"], name="sharing_sha_token_9e0a90_idx"),
        ),
        migrations.AddIndex(
            model_name="sharelink",
            index=models.Index(
                fields=["file", "created_by"], name="sharing_sha_file_id_f957d2_idx"
            ),
        ),
        migrations.AlterModelTable(
            name="fileshare",
            table=None,
        ),
        migrations.AlterModelTable(
            name="sharelink",
            table=None,
        ),
        migrations.DeleteModel(
            name="ShareAccess",
        ),
        migrations.AddField(
            model_name="sharelinkaccess",
            name="accessed_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="link_accesses",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="sharelinkaccess",
            name="share_link",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="accesses",
                to="sharing.sharelink",
            ),
        ),
        migrations.RemoveField(
            model_name="fileshare",
            name="is_active",
        ),
        migrations.RemoveField(
            model_name="fileshare",
            name="updated_at",
        ),
        migrations.AddIndex(
            model_name="sharelinkaccess",
            index=models.Index(
                fields=["share_link", "accessed_at"],
                name="sharing_sha_share_l_72a997_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="sharelinkaccess",
            index=models.Index(
                fields=["ip_address"], name="sharing_sha_ip_addr_821848_idx"
            ),
        ),
    ]
