import time
import logging
import json
from django.utils import timezone
from django.conf import settings
from django.core.exceptions import PermissionDenied
from django.http import HttpResponseServerError
from rest_framework.exceptions import APIException
from .exceptions import FileError, AuthenticationError

logger = logging.getLogger(__name__)

class RequestLoggingMiddleware:
    """Middleware for logging all requests and responses."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Start time of request
        start_time = time.time()

        # Generate request ID
        request.id = str(timezone.now().timestamp())

        # Log request
        self.log_request(request)

        try:
            # Get response
            response = self.get_response(request)

            # Log response
            self.log_response(request, response, start_time)

            return response

        except Exception as e:
            # Log error
            self.log_error(request, e, start_time)
            raise

    def log_request(self, request):
        """Log request details."""
        user = request.user.username if request.user.is_authenticated else 'anonymous'
        
        log_data = {
            'timestamp': timezone.now().isoformat(),
            'request_id': request.id,
            'user': user,
            'method': request.method,
            'path': request.path,
            'query_params': dict(request.GET.items()),
            'remote_addr': request.META.get('REMOTE_ADDR'),
            'user_agent': request.META.get('HTTP_USER_AGENT'),
        }

        # Don't log sensitive data in production
        if settings.DEBUG:
            log_data['body'] = request.body.decode('utf-8') if request.body else None
            log_data['headers'] = dict(request.headers.items())

        logger.info(f"Request: {json.dumps(log_data)}")

    def log_response(self, request, response, start_time):
        """Log response details."""
        duration = time.time() - start_time
        
        log_data = {
            'timestamp': timezone.now().isoformat(),
            'request_id': request.id,
            'status_code': response.status_code,
            'duration': f"{duration:.3f}s",
            'content_length': len(response.content) if hasattr(response, 'content') else 0,
        }

        # Don't log sensitive data in production
        if settings.DEBUG and not isinstance(response.content, bytes):
            try:
                log_data['body'] = json.loads(response.content.decode('utf-8'))
            except (json.JSONDecodeError, UnicodeDecodeError):
                log_data['body'] = 'Non-JSON response'

        logger.info(f"Response: {json.dumps(log_data)}")

    def log_error(self, request, exc, start_time):
        """Log error details."""
        duration = time.time() - start_time
        
        log_data = {
            'timestamp': timezone.now().isoformat(),
            'request_id': request.id,
            'error_type': exc.__class__.__name__,
            'error_message': str(exc),
            'duration': f"{duration:.3f}s",
        }

        if isinstance(exc, (FileError, AuthenticationError)):
            logger.warning(f"Application Error: {json.dumps(log_data)}")
        else:
            logger.error(f"System Error: {json.dumps(log_data)}")

class SecurityMiddleware:
    """Middleware for additional security checks."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Check rate limiting
        if self.is_rate_limited(request):
            raise PermissionDenied('Rate limit exceeded')

        # Check request size
        if self.is_request_too_large(request):
            raise PermissionDenied('Request too large')

        # Add security headers
        response = self.get_response(request)
        return self.add_security_headers(response)

    def is_rate_limited(self, request):
        """Check if request should be rate limited."""
        # Implement rate limiting logic here
        return False

    def is_request_too_large(self, request):
        """Check if request size exceeds limits."""
        if request.META.get('CONTENT_LENGTH'):
            return int(request.META['CONTENT_LENGTH']) > settings.DATA_UPLOAD_MAX_MEMORY_SIZE
        return False

    def add_security_headers(self, response):
        """Add security headers to response."""
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Permissions-Policy'] = 'geolocation=(), microphone=()'
        
        if not settings.DEBUG:
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        
        return response

class ErrorHandlingMiddleware:
    """Middleware for consistent error handling."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_exception(self, request, exception):
        """Handle exceptions and return appropriate responses."""
        if isinstance(exception, (FileError, AuthenticationError, APIException)):
            # These exceptions are already handled by DRF
            return None

        # Log unexpected errors
        logger.error(
            f"Unexpected error: {exception.__class__.__name__}",
            exc_info=exception,
            extra={
                'request_id': getattr(request, 'id', None),
                'user': request.user.username if request.user.is_authenticated else 'anonymous',
                'path': request.path,
            }
        )

        if settings.DEBUG:
            # Let Django's debug page handle it in development
            return None

        # Generic error response in production
        return HttpResponseServerError(
            json.dumps({
                'error': 'Internal server error',
                'request_id': getattr(request, 'id', None)
            }),
            content_type='application/json'
        ) 