from django.urls import path
from . import views

urlpatterns = [
    # File sharing endpoints
    path('files/<uuid:file_id>/shares/', views.CreateShareView.as_view(), name='create-share'),
    path('files/<uuid:file_id>/shares/list/', views.FileShareListView.as_view(), name='list-shares'),
    path('shares/<uuid:pk>/', views.ShareDetailView.as_view(), name='share-detail'),
    path('shares/<uuid:pk>/download/', views.ShareDownloadView.as_view(), name='share-download'),
    path('shares/<uuid:pk>/view/', views.ShareViewView.as_view(), name='share-view'),
    path('shares/<uuid:pk>/view-only/', views.ShareViewOnlyView.as_view(), name='share-view-only'),
    
    # Share link endpoints
    path('files/<uuid:file_id>/share-links/', views.ShareLinkListView.as_view(), name='create-share-link'),
    path('share-links/<uuid:pk>/', views.ShareLinkDetailView.as_view(), name='share-link-detail'),
    
    # Public access endpoints
    path('public/links/<str:token>/', views.PublicShareLinkView.as_view(), name='public-share-link'),
    path('public/links/<str:token>/download/', views.PublicShareDownloadView.as_view(), name='public-share-download'),
    path('public/links/<str:token>/view/', views.PublicShareViewView.as_view(), name='public-share-view'),
    path('public/links/<str:token>/view-only/', views.PublicShareViewOnlyView.as_view(), name='public-share-view-only'),
    path('public/links/<str:token>/verify-password/', views.VerifySharePasswordView.as_view(), name='verify-share-password'),
    
    # User shares management
    path('shared-with-me/', views.SharedWithMeView.as_view(), name='shared-with-me'),
    path('my-shares/', views.MySharesView.as_view(), name='my-shares'),
    path('shares/<uuid:pk>/access-logs/', views.ShareAccessLogsView.as_view(), name='share-access-logs'),
] 