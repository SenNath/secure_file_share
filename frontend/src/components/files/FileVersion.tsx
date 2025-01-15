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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { History, Download, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface FileVersionProps {
  fileId: string;
  fileName: string;
}

interface FileVersionData {
  id: string;
  version_number: number;
  size: number;
  checksum: string;
  created_at: string;
  created_by: {
    email: string;
  };
  comment?: string;
}

export const FileVersion = ({ fileId, fileName }: FileVersionProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [versions, setVersions] = useState<FileVersionData[]>([]);
  const { getFileVersions, downloadVersion } = useFiles({
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to load versions",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const loadVersions = async () => {
      if (isOpen) {
        try {
          const result = await getFileVersions(fileId);
          setVersions(result);
        } catch (error) {
          console.error("Failed to load versions:", error);
        }
      }
    };
    loadVersions();
  }, [fileId, isOpen, getFileVersions]);

  const handleDownloadVersion = async (versionId: string) => {
    try {
      await downloadVersion(fileId, versionId);
      toast({
        title: "Success",
        description: "Version downloaded successfully",
      });
    } catch (error) {
      console.error("Failed to download version:", error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <History className="h-4 w-4 mr-2" />
          Versions
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>File Versions</DialogTitle>
          <DialogDescription>
            View and manage versions of "{fileName}"
          </DialogDescription>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Version</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.map((version) => (
              <TableRow key={version.id}>
                <TableCell>v{version.version_number}</TableCell>
                <TableCell>{formatBytes(version.size)}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>
                      {formatDistanceToNow(new Date(version.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{version.created_by.email}</TableCell>
                <TableCell>{version.comment || "-"}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadVersion(version.id)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}; 