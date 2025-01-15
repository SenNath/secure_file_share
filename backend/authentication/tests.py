from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import MFADevice

User = get_user_model()

class AuthenticationTests(APITestCase):
    def setUp(self):
        self.register_url = reverse('register')
        self.login_url = reverse('login')
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'TestPass123!'
        }
        self.user = User.objects.create_user(
            username='existinguser',
            email='existing@example.com',
            password='ExistingPass123!'
        )

    def test_user_registration(self):
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='testuser').exists())
        self.assertIn('tokens', response.data)
        self.assertIn('user', response.data)

    def test_user_login_without_mfa(self):
        response = self.client.post(self.login_url, {
            'username': 'existinguser',
            'password': 'ExistingPass123!'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)
        self.assertIn('user', response.data)
        self.assertFalse(response.data.get('requires_mfa', False))

    def test_user_login_with_mfa(self):
        # Create MFA device for the user
        MFADevice.objects.create(
            user=self.user,
            is_active=True,
            secret='testsecret123'
        )

        response = self.client.post(self.login_url, {
            'username': 'existinguser',
            'password': 'ExistingPass123!'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('requires_mfa', False))
        self.assertNotIn('tokens', response.data)

    def test_mfa_verification(self):
        device = MFADevice.objects.create(
            user=self.user,
            is_active=True,
            secret='testsecret123'
        )

        # First login to get the session
        self.client.post(self.login_url, {
            'username': 'existinguser',
            'password': 'ExistingPass123!'
        }, format='json')

        # Verify MFA code
        response = self.client.post(reverse('mfa-verify'), {
            'code': '123456'  # This would be a valid TOTP code in real scenario
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)
        self.assertIn('user', response.data)

    def test_invalid_login_credentials(self):
        response = self.client.post(self.login_url, {
            'username': 'wronguser',
            'password': 'wrongpass'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_mfa_code(self):
        device = MFADevice.objects.create(
            user=self.user,
            is_active=True,
            secret='testsecret123'
        )

        # First login to get the session
        self.client.post(self.login_url, {
            'username': 'existinguser',
            'password': 'ExistingPass123!'
        }, format='json')

        # Try to verify with invalid code
        response = self.client.post(reverse('mfa-verify'), {
            'code': 'invalid'
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
