from django.contrib.auth import get_user_model
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from datetime import datetime, timedelta
import logging

User = get_user_model()
logger = logging.getLogger('secure_file_share')

class CustomJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        try:
            header = self.get_header(request)
            if header is None:
                logger.warning("No auth header found")
                return None

            raw_token = self.get_raw_token(header)
            if raw_token is None:
                logger.warning("No raw token found")
                return None

            validated_token = self.get_validated_token(raw_token)
            user = self.get_user(validated_token)

            if not user or not user.is_active:
                logger.warning(f"User not found or inactive: {validated_token.get('user_id')}")
                return None

            # Update last activity
            user.last_login = datetime.now()
            user.save(update_fields=['last_login'])
            logger.info(f"User {user.email} authenticated successfully")

            return user, validated_token
        except InvalidToken as e:
            logger.warning(f"Invalid token: {str(e)}")
            return None
        except TokenError as e:
            logger.warning(f"Token error: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            return None

def get_tokens_for_user(user):
    """Generate access and refresh tokens for user"""
    try:
        refresh = RefreshToken.for_user(user)
        logger.info(f"Generated new tokens for user: {user.email}")
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
    except Exception as e:
        logger.error(f"Error generating tokens for user {user.email}: {str(e)}")
        raise

def create_access_token(user):
    """Create a new access token for user"""
    try:
        refresh = RefreshToken.for_user(user)
        logger.info(f"Generated new access token for user: {user.email}")
        return str(refresh.access_token)
    except Exception as e:
        logger.error(f"Error generating access token for user {user.email}: {str(e)}")
        raise

def create_refresh_token(user):
    """Create a new refresh token for user"""
    try:
        refresh = RefreshToken.for_user(user)
        logger.info(f"Generated new refresh token for user: {user.email}")
        return str(refresh)
    except Exception as e:
        logger.error(f"Error generating refresh token for user {user.email}: {str(e)}")
        raise

def get_token_expiry(token):
    """Get token expiry time"""
    try:
        refresh = RefreshToken(token)
        return datetime.fromtimestamp(refresh['exp'])
    except (InvalidToken, TokenError) as e:
        logger.warning(f"Error getting token expiry: {str(e)}")
        return None

def is_token_expired(token):
    """Check if token is expired"""
    expiry = get_token_expiry(token)
    if expiry is None:
        return True
    return expiry <= datetime.now()

def refresh_access_token(refresh_token):
    """Get new access token using refresh token"""
    try:
        refresh = RefreshToken(refresh_token)
        logger.info("Successfully refreshed access token")
        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        }
    except (InvalidToken, TokenError) as e:
        logger.warning(f"Token refresh failed: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error during token refresh: {str(e)}")
        return None 