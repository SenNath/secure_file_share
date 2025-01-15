import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { useFiles } from "@/hooks/useFiles";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const SUPPORTED_FORMATS = [
  'PDF (.pdf)',
  'Word (.doc, .docx)',
  'Excel (.xls, .xlsx)',
  'PowerPoint (.ppt, .pptx)',
  'Text (.txt)',
  'Images (.jpg, .jpeg, .png, .gif)',
  'Archives (.zip, .rar, .7z)'
];

export const FileUpload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { uploadFile, listFiles } = useFiles({
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
      setIsUploading(false);
      setUploadProgress(0);
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      const result = await uploadFile(selectedFile, (progress) => {
        setUploadProgress(progress);
      });

      if (result) {
        await listFiles();
        
        toast({
          title: "Success",
          description: "File uploaded successfully",
        });
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Upload File</h2>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          isDragActive ? "border-primary bg-primary/5" : "border-gray-300"
        }`}
      >
        <input {...getInputProps()} />
        {selectedFile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-sm">{selectedFile.name}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {uploadProgress > 0 && (
              <Progress value={uploadProgress} className="w-full" />
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="text-gray-600">
              <p className="font-medium">
                {isDragActive
                  ? "Drop the file here"
                  : "Drag and drop a file here, or click to select"}
              </p>
              <p className="text-sm">Maximum file size: 100MB</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Info className="h-4 w-4" />
              Supported Formats
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-60">
            <div className="space-y-2">
              <h4 className="font-medium">Supported File Formats</h4>
              <ul className="text-sm space-y-1">
                {SUPPORTED_FORMATS.map((format) => (
                  <li key={format}>{format}</li>
                ))}
              </ul>
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex-1 flex justify-end space-x-4">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </div>
    </div>
  );
};