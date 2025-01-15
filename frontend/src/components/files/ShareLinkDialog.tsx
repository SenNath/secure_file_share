import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDays } from "date-fns";
import { ShareLinkData } from "@/hooks/useSharing";
import { Switch } from "@/components/ui/switch";

interface ShareLinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateLink: (data: ShareLinkData) => Promise<void>;
}

export const ShareLinkDialog = ({ isOpen, onClose, onCreateLink }: ShareLinkDialogProps) => {
  const [accessLevel, setAccessLevel] = useState<ShareLinkData["access_level"]>("VIEW");
  const [expiresIn, setExpiresIn] = useState("7"); // days
  const [maxUses, setMaxUses] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");

  const handleCreate = async () => {
    const expiresAt = addDays(new Date(), parseInt(expiresIn)).toISOString();
    await onCreateLink({
      access_level: accessLevel,
      expires_at: expiresAt,
      max_uses: maxUses ? parseInt(maxUses) : undefined,
      password: usePassword ? password : undefined,
    });
    onClose();
    // Reset form
    setAccessLevel("VIEW");
    setExpiresIn("7");
    setMaxUses("");
    setUsePassword(false);
    setPassword("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
                <SelectItem value="VIEW">View Only</SelectItem>
                <SelectItem value="EDIT">Edit</SelectItem>
                <SelectItem value="FULL">Full Access</SelectItem>
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
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate}>Create Link</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 