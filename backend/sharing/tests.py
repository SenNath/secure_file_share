from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from .models import FileShare, ShareLink
from files.models import File

User = get_user_model()

class FileShareTests(APITestCase):
    def setUp(self):
        # Create test users
        self.owner = User.objects.create_user(
            username='owner',
            email='owner@example.com',
            password='ownerpass123'
        )
        self.recipient = User.objects.create_user(
            username='recipient',
            email='recipient@example.com',
            password='recipientpass123'
        )
        
        # Create a test file
        self.file = File.objects.create(
            owner=self.owner,
            name='test.txt',
            original_name='test.txt',
            mime_type='text/plain',
            size=100,
            encryption_key='test_key',
            iv='test_iv',
            checksum='test_checksum'
        )
        
        # Authenticate as owner
        self.client.force_authenticate(user=self.owner)

    def test_create_file_share(self):
        response = self.client.post(f'/api/files/{self.file.id}/shares/', {
            'shared_with_email': self.recipient.email,
            'access_level': 'VIEW'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(FileShare.objects.count(), 1)
        share = FileShare.objects.first()
        self.assertEqual(share.shared_with, self.recipient)
        self.assertEqual(share.access_level, 'VIEW')

    def test_list_shared_files(self):
        # Create a share
        FileShare.objects.create(
            file=self.file,
            shared_by=self.owner,
            shared_with=self.recipient,
            access_level='VIEW'
        )
        
        # Test as recipient
        self.client.force_authenticate(user=self.recipient)
        response = self.client.get('/api/shared-with-me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_create_share_link(self):
        response = self.client.post(f'/api/files/{self.file.id}/share-links/', {
            'access_level': 'VIEW',
            'expires_at': '2024-12-31T23:59:59Z'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ShareLink.objects.count(), 1)
        share_link = ShareLink.objects.first()
        self.assertTrue(share_link.token)
        self.assertEqual(share_link.access_level, 'VIEW')

    def test_revoke_share(self):
        share = FileShare.objects.create(
            file=self.file,
            shared_by=self.owner,
            shared_with=self.recipient,
            access_level='VIEW'
        )
        response = self.client.delete(f'/api/shares/{share.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        share.refresh_from_db()
        self.assertTrue(share.is_revoked)

    def test_unauthorized_share_access(self):
        # Create share for recipient
        share = FileShare.objects.create(
            file=self.file,
            shared_by=self.owner,
            shared_with=self.recipient,
            access_level='VIEW'
        )
        
        # Create another user
        unauthorized_user = User.objects.create_user(
            username='unauthorized',
            email='unauthorized@example.com',
            password='unauthorizedpass123'
        )
        
        # Try to access as unauthorized user
        self.client.force_authenticate(user=unauthorized_user)
        response = self.client.get(f'/api/shares/{share.id}/download/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
