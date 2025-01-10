import { Button } from "@/components/ui/button";
import { Share2, Download, Trash2 } from "lucide-react";

interface File {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
}

export const FileList = () => {
  // Mock data for demonstration
  const files: File[] = [
    {
      id: "1",
      name: "document.pdf",
      size: 1024576,
      uploadedAt: "2024-02-20",
    },
  ];

  const formatSize = (bytes: number) => {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Byte";
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round(bytes / Math.pow(1024, i)) + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Your Files</h2>
      <div className="border rounded-lg divide-y">
        {files.map((file) => (
          <div
            key={file.id}
            className="p-4 flex items-center justify-between hover:bg-gray-50"
          >
            <div>
              <h3 className="font-medium">{file.name}</h3>
              <p className="text-sm text-gray-500">
                {formatSize(file.size)} • Uploaded on {file.uploadedAt}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="icon">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};