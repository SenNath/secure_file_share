#!/bin/bash

# Run migrations
python manage.py migrate

# Check if superuser exists and create if it doesn't
echo "Checking for existing superuser..."
python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(is_superuser=True).exists():
    print("No superuser found.")
    exit(1)
else:
    print("Superuser already exists.")
    exit(0)
EOF

if [ $? -eq 1 ]; then
    echo "Creating superuser through interactive prompt..."
    python manage.py createsuperuser
fi

# Start server with SSL
exec python manage.py runsslserver \
    --certificate certificates/server.crt \
    --key certificates/server.key \
    0.0.0.0:8000 