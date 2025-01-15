from django.core.management.commands.runserver import Command as RunserverCommand
from django.conf import settings
import os

class Command(RunserverCommand):
    help = 'Runs the server with SSL/TLS enabled'

    def handle(self, *args, **options):
        if not os.path.exists(settings.SSL_CERTIFICATE) or not os.path.exists(settings.SSL_PRIVATE_KEY):
            self.stdout.write(self.style.ERROR('SSL certificate or private key not found. Please run scripts/generate_cert.sh first.'))
            return

        options['ssl_certificate'] = settings.SSL_CERTIFICATE
        options['ssl_private_key'] = settings.SSL_PRIVATE_KEY
        super().handle(*args, **options)

    def get_handler(self, *args, **options):
        handler = super().get_handler(*args, **options)
        handler.ssl_certificate = options.get('ssl_certificate')
        handler.ssl_private_key = options.get('ssl_private_key')
        return handler 