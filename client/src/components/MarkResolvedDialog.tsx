import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface MarkResolvedDialogProps {
  feedbackId: string;
  trackingNumber: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function MarkResolvedDialog({
  feedbackId,
  trackingNumber,
  isOpen,
  onClose,
}: MarkResolvedDialogProps) {
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng nhập mật khẩu",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("POST", `/api/feedbacks/${feedbackId}/mark-resolved`, {
        password,
      });

      toast({
        title: "Thành công",
        description: `Kiến nghị #${trackingNumber} đã được chuyển sang trạng thái "Đã giải quyết"`,
      });

      await queryClient.invalidateQueries({ queryKey: ["/api/feedbacks"] });
      
      setPassword("");
      onClose();
    } catch (error: any) {
      let errorMessage = "Không thể cập nhật trạng thái";
      
      if (error && error.message && typeof error.message === "string") {
        const parts = error.message.split(": ", 2);
        if (parts.length === 2) {
          try {
            const jsonData = JSON.parse(parts[1]);
            if (jsonData && jsonData.error) {
              errorMessage = jsonData.error;
            }
          } catch {
            errorMessage = parts[1] || errorMessage;
          }
        }
      }
      
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" data-testid="dialog-mark-resolved">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Xác nhận đã xử lý xong</DialogTitle>
            <DialogDescription>
              Kiến nghị #{trackingNumber} - Nhập mật khẩu để xác nhận chuyển sang trạng thái "Đã giải quyết"
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu xác nhận"
                disabled={isSubmitting}
                data-testid="input-mark-resolved-password"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              data-testid="button-cancel-mark-resolved"
            >
              Hủy
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              data-testid="button-confirm-mark-resolved"
            >
              {isSubmitting ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
