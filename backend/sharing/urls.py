from django.urls import path
from . import views

urlpatterns = [
    # File Sharing
    path('files/<uuid:file_id>/share/', views.CreateShareView.as_view(), name='create-share'),
    path('files/<uuid:file_id>/shares/', views.FileShareListView.as_view(), name='file-shares'),
    path('shares/<uuid:pk>/', views.ShareDetailView.as_view(), name='share-detail'),
    path('shares/<uuid:pk>/revoke/', views.RevokeShareView.as_view(), name='revoke-share'),
    
    # Share Links
    path('shares/<uuid:share_id>/links/', views.ShareLinkListView.as_view(), name='share-links'),
    path('links/<uuid:pk>/', views.ShareLinkDetailView.as_view(), name='share-link-detail'),
    path('links/<uuid:pk>/revoke/', views.RevokeShareLinkView.as_view(), name='revoke-share-link'),
    
    # Public Access
    path('public/links/<str:token>/', views.PublicShareLinkView.as_view(), name='public-share-link'),
    path('public/links/<str:token>/download/', views.PublicShareDownloadView.as_view(), name='public-share-download'),
    path('public/links/<str:token>/verify-password/', views.VerifySharePasswordView.as_view(), name='verify-share-password'),
    
    # Share Management
    path('shared-with-me/', views.SharedWithMeView.as_view(), name='shared-with-me'),
    path('my-shares/', views.MySharesView.as_view(), name='my-shares'),
    
    # Access Logs
    path('shares/<uuid:share_id>/access-logs/', views.ShareAccessLogsView.as_view(), name='share-access-logs'),
] 