from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    EnableMFAView, DisableMFAView, VerifyMFAView,
    SendVerificationEmailView, VerifyEmailView,
    UserLoginView, UserRegistrationView, UserProfileView,
    UserLogoutView, UserListView, UserDetailView
)

urlpatterns = [
    path('login/', UserLoginView.as_view(), name='login'),
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('mfa/enable/', EnableMFAView.as_view(), name='enable-mfa'),
    path('mfa/disable/', DisableMFAView.as_view(), name='disable-mfa'),
    path('mfa/verify/', VerifyMFAView.as_view(), name='verify-mfa'),
    path('email/send-verification/', SendVerificationEmailView.as_view(), name='send-verification-email'),
    path('email/verify/', VerifyEmailView.as_view(), name='verify-email'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('logout/', UserLogoutView.as_view(), name='logout'),
    # User Management endpoints
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/<uuid:id>/', UserDetailView.as_view(), name='user-detail'),
] 