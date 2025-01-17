import { useState, useEffect } from 'react';
import { useFiles, FileMetadata } from '@/hooks/useFiles';
import { useToast } from '@/hooks/use-toast';
import api from '@/utils/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from 'date-fns';
import { FileText, MoreVertical, Download, Trash, Eye } from 'lucide-react';

interface Owner {
  id: string;
  email: string;
  username?: string;
}

interface AdminFileMetadata extends Omit<FileMetadata, 'owner'> {
  owner: Owner;
}

export const ManageFiles = () => {
  const { toast } = useToast();
  const [files, setFiles] = useState<AdminFileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const { deleteFile } = useFiles({
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to load files",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<{ results: AdminFileMetadata[] }>('/api/files/admin/list/');
      setFiles(data.results || []);
    } catch (error: any) {
      console.error('Error fetching files:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to fetch files",
        variant: "destructive",
      });
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (fileId: string) => {
    try {
      const response = await api.get<Blob>(`/api/files/${fileId}/content/`, {
        responseType: 'blob',
        params: { admin_access: true }
      });
      const url = URL.createObjectURL(response.data);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error viewing file:', error);
      toast({
        title: "Error",
        description: "Failed to view file",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (fileId: string) => {
    try {
      const response = await api.get<Blob>(`/api/files/${fileId}/download/`, {
        responseType: 'blob',
        params: { admin_access: true }
      });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', ''); // browser will detect filename from Content-Disposition
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast({
        title: "Success",
        description: "File downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      const response = await api.delete(`/api/files/${fileId}/`, {
        params: { admin_access: true }
      });
      if (response.status === 204) {
        await fetchFiles();
        toast({
          title: "Success",
          description: "File deleted successfully",
        });
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manage Files</h1>
        <div className="text-sm text-gray-500">
          Total Files: {files.length}
        </div>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText className="mx-auto h-12 w-12 mb-4" />
          <p>No files found</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead>Last Modified</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.id}>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span>{file.name}</span>
                  </div>
                </TableCell>
                <TableCell>{formatBytes(file.size)}</TableCell>
                <TableCell>{file.owner?.email || 'Unknown'}</TableCell>
                <TableCell>
                  {file.upload_completed_at
                    ? formatDistanceToNow(new Date(file.upload_completed_at), { addSuffix: true })
                    : 'Never'}
                </TableCell>
                <TableCell>
                  {file.modified_at
                    ? formatDistanceToNow(new Date(file.modified_at), { addSuffix: true })
                    : 'Never'}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleView(file.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(file.id)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(file.id)}
                        className="text-red-600"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}; 