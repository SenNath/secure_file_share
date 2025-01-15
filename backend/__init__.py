"""
Django backend initialization.
"""

from .celery_app import app as celery_app

__all__ = ('celery_app',)
default_app_config = 'backend.apps.BackendConfig'
