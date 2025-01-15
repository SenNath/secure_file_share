from django.shortcuts import render
from rest_framework import viewsets, mixins, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError

class BaseViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({
            'request': self.request,
            'user': self.request.user,
        })
        return context

class BaseModelViewSet(BaseViewSet,
                      mixins.CreateModelMixin,
                      mixins.RetrieveModelMixin,
                      mixins.UpdateModelMixin,
                      mixins.DestroyModelMixin,
                      mixins.ListModelMixin):
    """
    Base viewset that includes all common CRUD operations
    """
    pass

class BaseReadOnlyModelViewSet(BaseViewSet,
                             mixins.RetrieveModelMixin,
                             mixins.ListModelMixin):
    """
    Base viewset for read-only operations
    """
    pass
