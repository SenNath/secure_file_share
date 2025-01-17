#!/bin/bash

# Create certificates directory if it doesn't exist
mkdir -p ../certificates

# Generate SSL certificates if they don't exist
if [ ! -f "../certificates/server.crt" ] || [ ! -f "../certificates/server.key" ]; then
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ../certificates/server.key \
        -out ../certificates/server.crt \
        -subj "/CN=localhost" \
        -addext "subjectAltName = DNS:localhost,IP:127.0.0.1"
    
    # Set proper permissions
    chmod 600 ../certificates/server.key
    chmod 644 ../certificates/server.crt
fi

echo "SSL certificates generated successfully!"
