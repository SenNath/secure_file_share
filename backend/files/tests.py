from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from .models import File, FileVersion, FileChunk
import tempfile
import os
import uuid

User = get_user_model()

class FileModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_file_creation(self):
        file = File.objects.create(
            owner=self.user,
            name='test.txt',
            original_name='test.txt',
            mime_type='text/plain',
            size=100,
            encryption_key='test_key',
            iv='test_iv',
            checksum='test_checksum'
        )
        self.assertEqual(file.name, 'test.txt')
        self.assertEqual(file.status, File.Status.PENDING)
        self.assertFalse(file.is_deleted)

    def test_file_version_creation(self):
        file = File.objects.create(
            owner=self.user,
            name='test.txt',
            original_name='test.txt',
            mime_type='text/plain',
            size=100,
            encryption_key='test_key',
            iv='test_iv',
            checksum='test_checksum'
        )
        version = FileVersion.objects.create(
            file=file,
            version_number=1,
            encrypted_path='test_path',
            encryption_key='test_key',
            iv='test_iv',
            checksum='test_checksum',
            size=100,
            created_by=self.user
        )
        self.assertEqual(version.version_number, 1)
        self.assertEqual(version.file, file)

class FileAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

    def test_file_list(self):
        File.objects.create(
            owner=self.user,
            name='test1.txt',
            original_name='test1.txt',
            mime_type='text/plain',
            size=100,
            encryption_key='test_key',
            iv='test_iv',
            checksum='test_checksum'
        )
        response = self.client.get('/api/files/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_file_upload(self):
        # Create a temporary file for testing
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_file.write(b'Test content')
            temp_file.flush()

            # Initialize upload
            response = self.client.post('/api/files/upload/initialize/', {
                'name': 'test.txt',
                'mime_type': 'text/plain',
                'size': os.path.getsize(temp_file.name)
            })
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            file_id = response.data['id']

            # Upload chunk
            with open(temp_file.name, 'rb') as f:
                chunk_data = SimpleUploadedFile('chunk', f.read())
                response = self.client.post(
                    f'/api/files/upload/{file_id}/chunk/',
                    {'chunk': chunk_data, 'chunk_number': 0},
                    format='multipart'
                )
                self.assertEqual(response.status_code, status.HTTP_201_CREATED)

            # Complete upload
            response = self.client.post(f'/api/files/upload/{file_id}/complete/')
            self.assertEqual(response.status_code, status.HTTP_200_OK)

            # Clean up
            os.unlink(temp_file.name)

    def test_file_download(self):
        file = File.objects.create(
            owner=self.user,
            name='test.txt',
            original_name='test.txt',
            mime_type='text/plain',
            size=100,
            encryption_key='test_key',
            iv='test_iv',
            checksum='test_checksum',
            status=File.Status.COMPLETED
        )
        response = self.client.get(f'/api/files/{file.id}/download/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_file_delete(self):
        file = File.objects.create(
            owner=self.user,
            name='test.txt',
            original_name='test.txt',
            mime_type='text/plain',
            size=100,
            encryption_key='test_key',
            iv='test_iv',
            checksum='test_checksum'
        )
        response = self.client.delete(f'/api/files/{file.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        file.refresh_from_db()
        self.assertTrue(file.is_deleted)

    def test_file_move(self):
        file = File.objects.create(
            owner=self.user,
            name='test.txt',
            original_name='test.txt',
            mime_type='text/plain',
            size=100,
            encryption_key='test_key',
            iv='test_iv',
            checksum='test_checksum'
        )
        response = self.client.post(
            f'/api/files/{file.id}/move/',
            {'new_name': 'moved.txt'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        file.refresh_from_db()
        self.assertEqual(file.name, 'moved.txt')

    def test_file_copy(self):
        file = File.objects.create(
            owner=self.user,
            name='test.txt',
            original_name='test.txt',
            mime_type='text/plain',
            size=100,
            encryption_key='test_key',
            iv='test_iv',
            checksum='test_checksum',
            status=File.Status.COMPLETED
        )
        response = self.client.post(f'/api/files/{file.id}/copy/')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(File.objects.count(), 2)

    def test_bulk_operations(self):
        files = []
        for i in range(3):
            file = File.objects.create(
                owner=self.user,
                name=f'test{i}.txt',
                original_name=f'test{i}.txt',
                mime_type='text/plain',
                size=100,
                encryption_key='test_key',
                iv='test_iv',
                checksum='test_checksum'
            )
            files.append(file)

        # Test bulk delete
        file_ids = [str(f.id) for f in files[:2]]
        response = self.client.post('/api/files/bulk/delete/', {'file_ids': file_ids})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            File.objects.filter(is_deleted=True).count(),
            2
        )

        # Test bulk move
        file_ids = [str(files[2].id)]
        new_names = {str(files[2].id): 'moved.txt'}
        response = self.client.post('/api/files/bulk/move/', {
            'file_ids': file_ids,
            'new_names': new_names
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        files[2].refresh_from_db()
        self.assertEqual(files[2].name, 'moved.txt')

    def test_search_and_filters(self):
        # Create test files
        File.objects.create(
            owner=self.user,
            name='test1.txt',
            original_name='test1.txt',
            mime_type='text/plain',
            size=100,
            encryption_key='test_key',
            iv='test_iv',
            checksum='test_checksum'
        )
        File.objects.create(
            owner=self.user,
            name='test2.txt',
            original_name='test2.txt',
            mime_type='text/plain',
            size=100,
            encryption_key='test_key',
            iv='test_iv',
            checksum='test_checksum',
            is_deleted=True
        )

        # Test search
        response = self.client.get('/api/files/search/', {'q': 'test1'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        # Test recent files
        response = self.client.get('/api/files/recent/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        # Test trash
        response = self.client.get('/api/files/trash/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
