#!/bin/bash

# Run migrations
python manage.py migrate

# Check if superuser exists and create if it doesn't
echo "Checking for existing superuser..."
python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(is_superuser=True).exists():
    User.objects.create_superuser(
        email='admin@test.com',
        password='admin123'
    )
    print("Default Admin created successfully.")
else:
    print("Default Admin already exists.")
EOF

# Start server with SSL
exec python manage.py runsslserver \
    --certificate certificates/server.crt \
    --key certificates/server.key \
    0.0.0.0:8000 