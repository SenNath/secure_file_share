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
import { FileText, Undo2, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export const FileTrash = () => {
  const { toast } = useToast();
  const [files, setFiles] = useState<any[]>([]);
  const { getTrash, restoreFile, deleteFile, loading, error } = useFiles({
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Operation failed",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const loadTrash = async () => {
      try {
        const result = await getTrash();
        setFiles(result);
      } catch (error) {
        console.error("Failed to load trash:", error);
      }
    };
    loadTrash();
  }, [getTrash]);

  const handleRestore = async (fileId: string) => {
    try {
      await restoreFile(fileId);
      setFiles(files.filter(f => f.id !== fileId));
      toast({
        title: "Success",
        description: "File restored successfully",
      });
    } catch (error) {
      console.error("Failed to restore file:", error);
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      await deleteFile(fileId);
      setFiles(files.filter(f => f.id !== fileId));
      toast({
        title: "Success",
        description: "File permanently deleted",
      });
    } catch (error) {
      console.error("Failed to delete file:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Trash</h2>
        {files.length > 0 && (
          <Button
            variant="destructive"
            onClick={() => {
              // TODO: Implement empty trash functionality
              toast({
                title: "Info",
                description: "Empty trash functionality coming soon",
              });
            }}
          >
            Empty Trash
          </Button>
        )}
      </div>

      {files.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Trash2 className="mx-auto h-12 w-12 mb-4" />
          <p>Trash is empty</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Deleted</TableHead>
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
                <TableCell>
                  {formatDistanceToNow(new Date(file.deleted_at), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRestore(file.id)}
                    >
                      <Undo2 className="h-4 w-4 mr-2" />
                      Restore
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(file.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}; 