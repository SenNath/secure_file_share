#!/bin/bash
mkdir -p ../certificates
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ../certificates/server.key -out ../certificates/server.crt -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" -addext "subjectAltName = DNS:localhost,IP:127.0.0.1"
chmod 600 ../certificates/server.key
chmod 644 ../certificates/server.crt
echo "Self-signed certificates generated successfully!"
