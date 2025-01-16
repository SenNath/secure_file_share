import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import api from "@/utils/api";
import { ShareLink } from "@/hooks/useSharing";
import { useToast } from "@/hooks/use-toast";

const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

export const SharedFileView = () => {
  const { token } = useParams();
  const { toast } = useToast();
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);

  useEffect(() => {
    const fetchShareLink = async () => {
      try {
        const response = await api.get<ShareLink>(`/api/sharing/public/links/${token}/`);
        setShareLink(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load shared file");
      } finally {
        setLoading(false);
      }
    };

    fetchShareLink();
  }, [token]);

  const handleVerifyPassword = async () => {
    try {
      await api.post(`/api/sharing/public/links/${token}/verify-password/`, { password });
      setIsPasswordVerified(true);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid password");
    }
  };

  const handleDownload = async () => {
    try {
      const response = await api.get(`/api/sharing/public/links/${token}/download/`, {
        responseType: 'blob'
      }) as { data: Blob };
      
      // Create download link
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', shareLink?.file.name || 'download');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.error || "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const handleView = () => {
    // Use different view endpoints based on access level
    const viewEndpoint = shareLink?.access_level === 'VIEW' 
      ? `/api/sharing/public/links/${token}/view-only/`
      : `/api/sharing/public/links/${token}/view/`;
    window.open(viewEndpoint, '_blank');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (error && !shareLink) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (shareLink?.password_protected && !isPasswordVerified) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Password Protected File</CardTitle>
            <CardDescription>Enter the password to access this file</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleVerifyPassword}>Verify Password</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (shareLink) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Shared File</CardTitle>
            <CardDescription>{shareLink.file.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Size: {formatFileSize(shareLink.file.size)}
              </p>
              {shareLink.access_level === 'VIEW' && (
                <p className="text-sm text-yellow-600">
                  Note: This file is view-only and cannot be downloaded
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            {shareLink.access_level === 'FULL' && (
              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            )}
            <Button onClick={handleView}>
              View File
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return null;
}; 