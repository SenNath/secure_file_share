import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDays } from "date-fns";
import { ShareData } from "@/hooks/useSharing";

interface FileShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (data: ShareData) => Promise<void>;
}

export const FileShareDialog = ({ isOpen, onClose, onShare }: FileShareDialogProps) => {
  const [email, setEmail] = useState("");
  const [accessLevel, setAccessLevel] = useState<ShareData["access_level"]>("VIEW");
  const [expiresIn, setExpiresIn] = useState("7"); // days
  const [notes, setNotes] = useState("");

  const handleShare = async () => {
    const expiresAt = expiresIn ? addDays(new Date(), parseInt(expiresIn)).toISOString() : undefined;
    await onShare({
      shared_with_email: email,
      access_level: accessLevel,
      expires_at: expiresAt,
      notes: notes || undefined,
    });
    onClose();
    // Reset form
    setEmail("");
    setAccessLevel("VIEW");
    setExpiresIn("7");
    setNotes("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share File</DialogTitle>
          <DialogDescription>
            Share this file with another user by email
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="access">Access Level</Label>
            <Select value={accessLevel} onValueChange={(value: ShareData["access_level"]) => setAccessLevel(value)}>
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
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              placeholder="Add a note for the recipient"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleShare}>Share</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 