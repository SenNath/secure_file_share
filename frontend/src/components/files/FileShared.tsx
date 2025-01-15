import { useState, useEffect } from "react";
import { useFiles } from "@/hooks/useFiles";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Download, Clock, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface SharedFile {
  id: string;
  name: string;
  size: number;
  shared_by: {
    email: string;
  };
  shared_at: string;
  expires_at: string;
}

export const FileShared = () => {
  const { toast } = useToast();
  const [files, setFiles] = useState<SharedFile[]>([]);
  const { getSharedFiles, downloadSharedFile, loading, error } = useFiles({
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to load shared files",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const loadSharedFiles = async () => {
      try {
        const result = await getSharedFiles();
        setFiles(result);
      } catch (error) {
        console.error("Failed to load shared files:", error);
      }
    };
    loadSharedFiles();
  }, [getSharedFiles]);

  const handleDownload = async (fileId: string) => {
    try {
      await downloadSharedFile(fileId);
      toast({
        title: "Success",
        description: "File downloaded successfully",
      });
    } catch (error) {
      console.error("Failed to download file:", error);
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

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Shared with Me</h2>

      {files.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText className="mx-auto h-12 w-12 mb-4" />
          <p>No files have been shared with you</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Shared By</TableHead>
              <TableHead>Shared</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Actions</TableHead>
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
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>{file.shared_by.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>
                      {formatDistanceToNow(new Date(file.shared_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(file.expires_at), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(file.id)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}; 