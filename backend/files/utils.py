import os
import uuid
import hashlib
import logging
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from base64 import b64encode, b64decode
from django.conf import settings
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404
from rest_framework.exceptions import APIException
from .exceptions import FileError, AuthenticationError

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """Custom exception handler for consistent error responses."""
    
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    # If unexpected error occurs
    if response is None:
        if isinstance(exc, DjangoValidationError):
            response = Response({
                'error': 'Validation Error',
                'detail': exc.messages[0] if exc.messages else str(exc),
                'code': 'validation_error'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        elif isinstance(exc, Http404):
            response = Response({
                'error': 'Not Found',
                'detail': str(exc),
                'code': 'not_found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        else:
            # Log unexpected errors
            logger.error(
                f"Unexpected error: {exc.__class__.__name__}",
                exc_info=exc,
                extra={
                    'view': context['view'].__class__.__name__,
                    'request_path': context['request'].path,
                    'user': context['request'].user.username if context['request'].user.is_authenticated else 'anonymous'
                }
            )
            
            response = Response({
                'error': 'Internal Server Error',
                'detail': 'An unexpected error occurred.',
                'code': 'internal_error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # Add request ID if available
    if hasattr(context['request'], 'id'):
        response.data['request_id'] = context['request'].id
    
    # Add error code if not present
    if 'code' not in response.data:
        if isinstance(exc, FileError):
            response.data['code'] = exc.default_code
        elif isinstance(exc, AuthenticationError):
            response.data['code'] = exc.default_code
        elif isinstance(exc, APIException):
            response.data['code'] = exc.default_code if hasattr(exc, 'default_code') else 'api_error'
    
    return response

def generate_file_path(instance, filename):
    """Generate a unique file path for uploaded files."""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('files', str(instance.owner.id), filename)

def generate_encryption_key():
    """Generate a new encryption key."""
    return Fernet.generate_key()

def derive_key(key, salt):
    """Derive an encryption key using PBKDF2."""
    if isinstance(key, str):
        key = key.encode('utf-8')
    
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    return kdf.derive(key)

def encrypt_file(file_path, key):
    """
    Encrypt a file using AES-256-CBC.
    Returns (encrypted_data, iv).
    """
    iv = os.urandom(16)
    
    # If key is already bytes, use it directly
    if isinstance(key, str):
        key = key.encode('utf-8')
    
    derived_key = derive_key(key, iv)
    
    cipher = Cipher(algorithms.AES(derived_key), modes.CBC(iv))
    encryptor = cipher.encryptor()
    
    padder = padding.PKCS7(128).padder()
    
    with open(file_path, 'rb') as f:
        data = f.read()
    
    padded_data = padder.update(data) + padder.finalize()
    encrypted_data = encryptor.update(padded_data) + encryptor.finalize()
    
    return encrypted_data, iv

def decrypt_file(encrypted_data, key, iv):
    """
    Decrypt file data using AES-256-CBC.
    Returns decrypted data.
    """
    try:
        # Handle base64 decoding for key and iv if they're strings
        if isinstance(key, str):
            key = b64decode(key)
        if isinstance(iv, str):
            iv = b64decode(iv)
        
        derived_key = derive_key(key, iv)
        
        cipher = Cipher(algorithms.AES(derived_key), modes.CBC(iv))
        decryptor = cipher.decryptor()
        
        unpadder = padding.PKCS7(128).unpadder()
        
        decrypted_padded = decryptor.update(encrypted_data) + decryptor.finalize()
        decrypted = unpadder.update(decrypted_padded) + unpadder.finalize()
        
        return decrypted
    except Exception as e:
        print(f"Decryption error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise

def calculate_file_hash(file_path):
    """Calculate SHA-256 hash of a file."""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def get_file_size(file_path):
    """Get file size in bytes."""
    return os.path.getsize(file_path)

def ensure_directory_exists(path):
    """Ensure that a directory exists, create if it doesn't."""
    os.makedirs(os.path.dirname(path), exist_ok=True)

def clean_filename(filename):
    """Clean and sanitize filename."""
    # Remove potentially dangerous characters
    filename = "".join(c for c in filename if c.isalnum() or c in "._- ")
    return filename.strip()

def get_mime_type(file_path):
    """Get MIME type of a file."""
    import magic
    mime = magic.Magic(mime=True)
    return mime.from_file(file_path)

def is_valid_file_type(mime_type):
    """Check if file type is allowed."""
    ALLOWED_MIME_TYPES = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed'
    ]
    return mime_type in ALLOWED_MIME_TYPES 