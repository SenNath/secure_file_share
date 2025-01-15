from django.db import migrations

def create_default_roles(apps, schema_editor):
    Role = apps.get_model('authentication', 'Role')
    
    # Create ADMIN role
    Role.objects.get_or_create(
        name='ADMIN',
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
    
    # Create REGULAR role
    Role.objects.get_or_create(
        name='REGULAR',
        defaults={
            'permissions': {
                'permissions': [
                    'upload_files',
                    'download_files',
                    'share_files',
                    'manage_own_files'
                ]
            }
        }
    )
    
    # Create GUEST role
    Role.objects.get_or_create(
        name='GUEST',
        defaults={
            'permissions': {
                'permissions': [
                    'download_files',
                    'view_shared_files'
                ]
            }
        }
    )

def delete_default_roles(apps, schema_editor):
    Role = apps.get_model('authentication', 'Role')
    Role.objects.filter(name__in=['ADMIN', 'REGULAR', 'GUEST']).delete()

class Migration(migrations.Migration):
    dependencies = [
        ('authentication', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_default_roles, delete_default_roles),
    ] 