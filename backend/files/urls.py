from django.urls import path
from . import views

urlpatterns = [
    # File Management
    path('', views.FileListCreateView.as_view(), name='file-list'),
    path('<uuid:pk>/', views.FileDetailView.as_view(), name='file-detail'),
    path('<uuid:pk>/content/', views.FileContentView.as_view(), name='file-content'),
    path('<uuid:pk>/download/', views.FileDownloadView.as_view(), name='file-download'),
    
    # File Versions
    path('<uuid:pk>/versions/', views.FileVersionListView.as_view(), name='file-versions'),
    path('<uuid:file_pk>/versions/<int:version>/', views.FileVersionDetailView.as_view(), name='file-version-detail'),
    
    # File Upload
    path('upload/initialize/', views.InitializeUploadView.as_view(), name='initialize-upload'),
    path('upload/<uuid:file_id>/chunk/', views.UploadChunkView.as_view(), name='upload-chunk'),
    path('upload/<uuid:file_id>/complete/', views.CompleteUploadView.as_view(), name='complete-upload'),
    
    # File Operations
    path('<uuid:pk>/move/', views.FileMoveView.as_view(), name='file-move'),
    path('<uuid:pk>/copy/', views.FileCopyView.as_view(), name='file-copy'),
    path('<uuid:pk>/restore/', views.FileRestoreView.as_view(), name='file-restore'),
    
    # Bulk Operations
    path('bulk/delete/', views.BulkDeleteView.as_view(), name='bulk-delete'),
    path('bulk/move/', views.BulkMoveView.as_view(), name='bulk-move'),
    path('bulk/copy/', views.BulkCopyView.as_view(), name='bulk-copy'),
    
    # Search and Filters
    path('search/', views.FileSearchView.as_view(), name='file-search'),
    path('recent/', views.RecentFilesView.as_view(), name='recent-files'),
    path('trash/', views.TrashView.as_view(), name='trash'),
] 