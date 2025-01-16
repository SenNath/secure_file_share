import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDays } from "date-fns";
import { ShareLinkData, ShareLink } from "@/hooks/useSharing";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Copy } from "lucide-react";

interface ShareLinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateLink: (data: ShareLinkData) => Promise<ShareLink | null>;
}

export const ShareLinkDialog = ({ isOpen, onClose, onCreateLink }: ShareLinkDialogProps) => {
  const [accessLevel, setAccessLevel] = useState<ShareLinkData["access_level"]>("VIEW");
  const [expiresIn, setExpiresIn] = useState("7"); // days
  const [maxUses, setMaxUses] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [createdLink, setCreatedLink] = useState<ShareLink | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const handleCreate = async () => {
    const expiresAt = addDays(new Date(), parseInt(expiresIn)).toISOString();
    const result = await onCreateLink({
      access_level: accessLevel,
      expires_at: expiresAt,
      max_uses: maxUses ? parseInt(maxUses) : undefined,
      password: usePassword ? password : undefined,
    });
    
    if (result) {
      setCreatedLink(result);
      setShowSuccessDialog(true);
    }
    
    // Reset form
    setAccessLevel("VIEW");
    setExpiresIn("7");
    setMaxUses("");
    setUsePassword(false);
    setPassword("");
  };

  const handleCopyLink = () => {
    if (createdLink) {
      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/share/${createdLink.token}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    }
  };

  const handleClose = () => {
    setCreatedLink(null);
    setShowSuccessDialog(false);
    onClose();
  };

  if (showSuccessDialog && createdLink) {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/share/${createdLink.token}`;
    
    return (
      <Dialog open={true} onOpenChange={() => handleClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Link Created</DialogTitle>
            <DialogDescription>
              Your share link has been created successfully. Copy the link below to share it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Input
                readOnly
                value={shareUrl}
                className="flex-1"
              />
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {usePassword && (
              <div className="text-sm text-muted-foreground">
                Remember to share the password separately with your recipient.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Share Link</DialogTitle>
          <DialogDescription>
            Create a shareable link with optional password protection
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="access">Access Level</Label>
            <Select value={accessLevel} onValueChange={(value: ShareLinkData["access_level"]) => setAccessLevel(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIEW">View Only (No Download)</SelectItem>
                <SelectItem value="FULL">Full Access (View, Download & Edit)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expires">Expires In (Days)</Label>
            <Input
              id="expires"
              type="number"
              min="1"
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxUses">Max Uses (Optional)</Label>
            <Input
              id="maxUses"
              type="number"
              min="1"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="Unlimited"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="password"
              checked={usePassword}
              onCheckedChange={setUsePassword}
            />
            <Label htmlFor="password">Password Protection</Label>
          </div>
          {usePassword && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a secure password"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleCreate}>Create Link</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 