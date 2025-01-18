#!/bin/bash

# Print current working directory
echo "Current working directory: $(pwd)"

# Create certificates directory if it doesn't exist
mkdir -p /certificates
echo "Created certificates directory at /certificates"

# Generate SSL certificates if they don't exist
if [ ! -f "/certificates/server.crt" ] || [ ! -f "/certificates/server.key" ]; then
    echo "Generating new SSL certificates..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /certificates/server.key \
        -out /certificates/server.crt \
        -subj "/CN=localhost" \
        -addext "subjectAltName = DNS:localhost,IP:127.0.0.1"
    
    # Set proper permissions
    chmod 600 /certificates/server.key
    chmod 644 /certificates/server.crt
    
    echo "Generated certificates:"
    ls -la /certificates/
else
    echo "Certificates already exist:"
    ls -la /certificates/
fi

echo "SSL certificates setup completed!"
