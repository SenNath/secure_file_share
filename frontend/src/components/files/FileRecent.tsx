import { useState, useEffect } from "react";
import { useFiles } from "@/hooks/useFiles";
import { FileList } from "./FileList";
import { useToast } from "@/hooks/use-toast";

export const FileRecent = () => {
  const { toast } = useToast();
  const [files, setFiles] = useState<any[]>([]);
  const { getRecentFiles, loading, error } = useFiles({
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to load recent files",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const loadRecentFiles = async () => {
      try {
        const result = await getRecentFiles();
        setFiles(result);
      } catch (error) {
        console.error("Failed to load recent files:", error);
      }
    };
    loadRecentFiles();
  }, [getRecentFiles]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Recently Accessed Files</h2>
      <FileList files={files} />
    </div>
  );
}; 