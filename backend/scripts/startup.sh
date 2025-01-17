#!/bin/bash

# Create certificates directory if it doesn't exist
mkdir -p certificates

# Generate SSL certificates if they don't exist
if [ ! -f "certificates/server.crt" ] || [ ! -f "certificates/server.key" ]; then
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout certificates/server.key \
        -out certificates/server.crt \
        -subj '/CN=localhost'
fi

# Run migrations
python manage.py migrate

# Check if superuser exists and create if it doesn't
echo "Checking for existing superuser..."
if ! python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); exit(User.objects.filter(is_superuser=True).exists())"; then
    echo "No superuser found. Creating superuser..."
    python manage.py createsuperuser
else
    echo "Superuser already exists. Skipping creation."
fi

# Start server with SSL
exec python manage.py runsslserver \
    --certificate certificates/server.crt \
    --key certificates/server.key \
    0.0.0.0:8000 