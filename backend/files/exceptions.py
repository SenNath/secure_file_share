from rest_framework.exceptions import APIException
from rest_framework import status

class FileError(APIException):
    """Base exception for file-related errors."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'An error occurred while processing the file.'
    default_code = 'file_error'

class FileNotFoundError(FileError):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'The requested file was not found.'
    default_code = 'file_not_found'

class FileAccessError(FileError):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'You do not have permission to access this file.'
    default_code = 'file_access_denied'

class FileUploadError(FileError):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'An error occurred while uploading the file.'
    default_code = 'file_upload_error'

class FileDownloadError(FileError):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'An error occurred while downloading the file.'
    default_code = 'file_download_error'

class FileEncryptionError(FileError):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = 'An error occurred while encrypting/decrypting the file.'
    default_code = 'file_encryption_error'

class InvalidFileTypeError(FileError):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'The file type is not supported.'
    default_code = 'invalid_file_type'

class FileSizeError(FileError):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'The file size exceeds the maximum allowed limit.'
    default_code = 'file_size_error'

class ChunkUploadError(FileError):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'An error occurred while uploading file chunk.'
    default_code = 'chunk_upload_error'

class ChunkMissingError(FileError):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'One or more file chunks are missing.'
    default_code = 'chunk_missing'

class FileVersionError(FileError):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'An error occurred while processing file version.'
    default_code = 'file_version_error'

class AuthenticationError(APIException):
    """Base exception for authentication-related errors."""
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = 'Authentication failed.'
    default_code = 'authentication_error'

class InvalidCredentialsError(AuthenticationError):
    default_detail = 'Invalid credentials provided.'
    default_code = 'invalid_credentials'

class TokenError(AuthenticationError):
    default_detail = 'Invalid or expired token.'
    default_code = 'token_error'

class RegistrationError(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Registration failed.'
    default_code = 'registration_error'

class UserExistsError(RegistrationError):
    default_detail = 'A user with this username or email already exists.'
    default_code = 'user_exists'

class ValidationError(APIException):
    """Base exception for validation errors."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Validation failed.'
    default_code = 'validation_error'

class PasswordError(ValidationError):
    default_detail = 'Password validation failed.'
    default_code = 'password_error'

class InvalidRequestError(ValidationError):
    default_detail = 'Invalid request parameters.'
    default_code = 'invalid_request' 