#!/bin/bash

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