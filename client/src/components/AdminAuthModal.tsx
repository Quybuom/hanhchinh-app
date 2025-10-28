import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, AlertCircle } from "lucide-react";

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticate: (password: string) => boolean;
}

export default function AdminAuthModal({
  isOpen,
  onClose,
  onAuthenticate,
}: AdminAuthModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onAuthenticate(password);
    if (success) {
      setPassword("");
      setError(false);
    } else {
      setError(true);
    }
  };

  const handleClose = () => {
    setPassword("");
    setError(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-admin-auth">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Đăng nhập quản trị</DialogTitle>
          <DialogDescription className="text-center">
            Nhập mật khẩu để truy cập chế độ quản trị viên
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              data-testid="input-password"
              autoFocus
            />
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive" data-testid="error-message">
                <AlertCircle className="w-4 h-4" />
                <span>Mật khẩu không chính xác</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              data-testid="button-cancel"
            >
              Hủy
            </Button>
            <Button type="submit" data-testid="button-login">
              Đăng nhập
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
