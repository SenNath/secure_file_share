import { useFiles } from "@/hooks/useFiles";
import { Button } from "@/components/ui/button";
import { Undo2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileRestoreProps {
  fileId: string;
  onRestore?: () => void;
}

export const FileRestore = ({ fileId, onRestore }: FileRestoreProps) => {
  const { toast } = useToast();
  const { restoreFile } = useFiles({
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to restore file",
        variant: "destructive",
      });
    },
  });

  const handleRestore = async () => {
    try {
      await restoreFile(fileId);
      toast({
        title: "Success",
        description: "File restored successfully",
      });
      onRestore?.();
    } catch (error) {
      console.error("Failed to restore file:", error);
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleRestore}>
      <Undo2 className="h-4 w-4 mr-2" />
      Restore
    </Button>
  );
}; 