import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useFiles, FileMetadata } from "@/hooks/useFiles";
import { useSharing } from "@/hooks/useSharing";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, MoreVertical, Download, Trash, Share2, Link as LinkIcon } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { FileShareDialog } from "./FileShare";
import { ShareLinkDialog } from "./ShareLinkDialog";

interface FileListProps {
  files?: FileMetadata[];
  showUploadButton?: boolean;
}

export const FileList = ({ files: propFiles, showUploadButton = true }: FileListProps) => {
  const { toast } = useToast();
  const {
    listFiles,
    downloadFile,
    deleteFile,
    loading,
    error
  } = useFiles({
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Operation failed",
        variant: "destructive",
      });
    },
  });

  const { shareFile, createShareLink } = useSharing({
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Sharing operation failed",
        variant: "destructive",
      });
    },
  });

  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLinkDialogOpen, setShareLinkDialogOpen] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    try {
      return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid date';
    }
  };

  // Load files on mount and when propFiles changes
  useEffect(() => {
    if (propFiles) {
      setFiles(propFiles);
      return;
    }

    const loadFiles = async () => {
      try {
        const result = await listFiles();
        setFiles(result || []);
      } catch (error) {
        console.error('Error loading files:', error);
      }
    };

    loadFiles();
  }, [propFiles]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh files after operations
  const refreshFiles = useCallback(async () => {
    if (propFiles) return;
    
    try {
      const result = await listFiles();
      setFiles(result || []);
    } catch (error) {
      console.error('Error refreshing files:', error);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDownload = async (fileId: string) => {
    await downloadFile(fileId);
  };

  const handleDelete = async (fileId: string) => {
    const success = await deleteFile(fileId);
    if (success) {
      await refreshFiles();
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    }
  };

  const handleShare = async (fileId: string) => {
    setSelectedFileId(fileId);
    setShareDialogOpen(true);
  };

  const handleCreateShareLink = async (fileId: string) => {
    setSelectedFileId(fileId);
    setShareLinkDialogOpen(true);
  };

  const handleShareSubmit = async (data: Parameters<typeof shareFile>[1]) => {
    if (!selectedFileId) return;
    
    const result = await shareFile(selectedFileId, data);
    if (result) {
      toast({
        title: "Success",
        description: "File shared successfully",
      });
    }
  };

  const handleShareLinkSubmit = async (data: Parameters<typeof createShareLink>[1]) => {
    if (!selectedFileId) return;
    
    const result = await createShareLink(selectedFileId, data);
    if (result) {
      // Copy link to clipboard
      navigator.clipboard.writeText(result.share_link);
      toast({
        title: "Success",
        description: "Share link created and copied to clipboard",
      });
    }
  };

  if (loading && !propFiles) {
    return <div>Loading...</div>;
  }

  if (error && !propFiles) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Files</h2>
        {showUploadButton && (
          <Button asChild>
            <Link to="/dashboard/upload">Upload New File</Link>
          </Button>
        )}
      </div>

      {files.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No files found</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Last Modified</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.id}>
                <TableCell className="font-medium">{file.name}</TableCell>
                <TableCell>{(file.size / 1024 / 1024).toFixed(2)} MB</TableCell>
                <TableCell>{formatDate(file.upload_completed_at)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDownload(file.id)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare(file.id)}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share with User
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCreateShareLink(file.id)}>
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Create Share Link
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDelete(file.id)} className="text-red-600">
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

      <FileShareDialog
        isOpen={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        onShare={handleShareSubmit}
      />

      <ShareLinkDialog
        isOpen={shareLinkDialogOpen}
        onClose={() => setShareLinkDialogOpen(false)}
        onCreateLink={handleShareLinkSubmit}
      />
    </div>
  );
};