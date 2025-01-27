from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model, authenticate
from django.utils import timezone
from .models import MFADevice, LoginAttempt, User, Role
from django.core.mail import send_mail
from django.conf import settings
import pyotp
import secrets
from .serializers import UserSerializer, RegisterSerializer, AdminUserSerializer
from django.db import models
import logging
from .auth import get_tokens_for_user, refresh_access_token
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from functools import wraps

User = get_user_model()
logger = logging.getLogger('secure_file_share')

def admin_required(view_func):
    @wraps(view_func)
    def _wrapped_view(view_instance, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
        if not request.user.role or request.user.role.name != 'ADMIN':
            return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)
        return view_func(view_instance, request, *args, **kwargs)
    return _wrapped_view

class UserRegistrationView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    
    def perform_create(self, serializer):
        # Get or create REGULAR role
        regular_role, _ = Role.objects.get_or_create(
            name=Role.REGULAR,
            defaults={
                'permissions': {
                    'permissions': [
                        'upload_files',
                        'download_files',
                        'share_files',
                        'manage_own_files'
                    ]
                }
            }
        )
        
        # Create user with REGULAR role
        user = serializer.save()
        user.role = regular_role
        user.save()
        
        return user

class UserLoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        try:
            email = request.data.get('email')
            password = request.data.get('password')

            if not all([email, password]):
                return Response(
                    {'error': 'Please provide email and password'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            logger.info(f"Attempting authentication for email: {email}")
            user = authenticate(email=email, password=password)
            
            if not user:
                logger.warning(f"Authentication failed for email: {email}")
                return Response(
                    {'error': 'Invalid credentials'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # Update last login time
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])

            # Record login attempt
            LoginAttempt.objects.create(
                user=user,
                ip_address=request.META.get('REMOTE_ADDR', ''),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                status='success'
            )

            # Check if MFA is enabled
            if user.mfa_enabled:
                logger.info(f"MFA required for user: {email}")
                return Response({
                    'requires_mfa': True,
                    'user': UserSerializer(user).data
                })

            # Generate tokens if MFA is not enabled
            tokens = get_tokens_for_user(user)
            logger.info(f"Login successful for user: {email}")
            response_data = {
                'user': UserSerializer(user).data,
                'access': tokens['access'],
                'refresh': tokens['refresh'],
                'requires_mfa': False
            }
            
            return Response(response_data)

        except Exception as e:
            logger.error(f"Login error: {str(e)}", exc_info=True)
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UserLogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Clear the refresh token cookie if it exists
            response = Response({"detail": "Successfully logged out"})
            response.delete_cookie('refresh_token')
            return response
        except Exception as e:
            return Response(
                {"error": "Failed to logout"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class EnableMFAView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        # For authenticated users (enabling MFA from dashboard)
        if request.user.is_authenticated:
            user = request.user
            if user.mfa_enabled:
                return Response({"error": "MFA is already enabled"}, status=status.HTTP_400_BAD_REQUEST)
        # For unauthenticated users (during registration)
        else:
            email = request.data.get('email')
            if not email:
                return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
                
            try:
                user = User.objects.get(email=email)
                if user.mfa_enabled:
                    return Response({"error": "MFA is already enabled"}, status=status.HTTP_400_BAD_REQUEST)
            except User.DoesNotExist:
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Generate secret key for TOTP
        secret = pyotp.random_base32()
        totp = pyotp.TOTP(secret)
        
        # Generate backup codes
        backup_codes = [secrets.token_hex(4) for _ in range(5)]
        
        user.mfa_secret = secret
        user.mfa_backup_codes = backup_codes
        user.save()
        
        # Generate QR code provisioning URI
        provisioning_uri = totp.provisioning_uri(user.email, issuer_name="SecureFileShare")
        
        return Response({
            "secret": secret,
            "backup_codes": backup_codes,
            "qr_uri": provisioning_uri
        })

class DisableMFAView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if not user.mfa_enabled:
            return Response({"error": "MFA is not enabled"}, status=status.HTTP_400_BAD_REQUEST)
        
        user.mfa_enabled = False
        user.mfa_secret = None
        user.mfa_backup_codes = []
        user.save()
        
        return Response({"message": "MFA disabled successfully"})

class VerifyMFAView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        
        if not email or not code:
            return Response({"error": "Email and code are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            totp = pyotp.TOTP(user.mfa_secret)
            if totp.verify(code):
                # If MFA is not enabled yet (registration flow)
                if not user.mfa_enabled:
                    user.mfa_enabled = True
                    user.save()
                    return Response({"message": "MFA enabled successfully"})
                
                # If MFA is already enabled (login flow)
                # Generate tokens directly without requiring password again
                tokens = get_tokens_for_user(user)
                logger.info(f"MFA verification successful for user: {email}")
                response_data = {
                    'user': UserSerializer(user).data,
                    'access': tokens['access'],
                    'refresh': tokens['refresh'],
                    'requires_mfa': False
                }
                return Response(response_data)
            
            logger.warning(f"Invalid MFA code for user: {email}")
            return Response({"error": "Invalid code"}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            logger.warning(f"User not found during MFA verification: {email}")
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

class MFADeviceListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    # serializer_class will be added later

    def get_queryset(self):
        return MFADevice.objects.filter(user=self.request.user)

class MFADeviceDetailView(generics.RetrieveDestroyAPIView):
    permission_classes = [IsAuthenticated]
    # serializer_class will be added later

    def get_queryset(self):
        return MFADevice.objects.filter(user=self.request.user)

class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Implementation will be added later
        pass

class PasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        # Implementation will be added later
        pass

class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        # Implementation will be added later
        pass

class UserListView(generics.ListAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [IsAuthenticated]
    
    @admin_required
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
    
    def get_queryset(self):
        queryset = User.objects.all().select_related('role')
        
        # Filter by role
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role__name=role)
            
        # Filter by status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            is_active = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active)
            
        # Search by email or name
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                models.Q(email__icontains=search) |
                models.Q(first_name__icontains=search) |
                models.Q(last_name__icontains=search)
            )
            
        return queryset.order_by('-date_joined')

class UserDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
    
    @admin_required
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
    
    @admin_required
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)
    
    @admin_required
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)
    
    def get_queryset(self):
        return User.objects.all().select_related('role')
        
    def update(self, request, *args, **kwargs):
        if str(request.user.id) == str(kwargs.get('id')):
            return Response(
                {"error": "Cannot modify your own user through admin interface"},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().update(request, *args, **kwargs)

class SendVerificationEmailView(APIView):
    def post(self, request):
        user = request.user
        if user.email_verified:
            return Response({"error": "Email already verified"}, status=status.HTTP_400_BAD_REQUEST)
        
        token = secrets.token_urlsafe(32)
        user.verification_token = token
        user.save()
        
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        
        send_mail(
            'Verify your email',
            f'Click this link to verify your email: {verification_url}',
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        
        return Response({"message": "Verification email sent"})

class VerifyEmailView(APIView):
    def post(self, request):
        token = request.data.get("token")
        if not token:
            return Response({"error": "Token is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(verification_token=token)
            user.email_verified = True
            user.verification_token = None
            user.save()
            return Response({"message": "Email verified successfully"})
        except User.DoesNotExist:
            return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

class TokenRefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if not refresh_token:
                logger.warning("Token refresh attempt without refresh token")
                return Response(
                    {'error': 'Refresh token is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            tokens = refresh_access_token(refresh_token)
            if not tokens:
                logger.warning("Invalid or expired refresh token")
                return Response(
                    {'error': 'Invalid or expired refresh token'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            logger.info("Access token refreshed successfully")
            return Response(tokens)

        except Exception as e:
            logger.error(f"Token refresh error: {str(e)}", exc_info=True)
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
