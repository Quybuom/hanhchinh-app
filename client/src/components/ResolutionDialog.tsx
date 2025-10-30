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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";

interface ResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (resolutionComment: string) => void;
  isPending?: boolean;
}

export default function ResolutionDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending = false,
}: ResolutionDialogProps) {
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    onSubmit(comment.trim());
    setComment("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-resolution">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Đánh dấu đã xử lý
          </DialogTitle>
          <DialogDescription>
            Vui lòng nhập ý kiến giải quyết trước khi hoàn tất
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="resolution-comment">
              Ý kiến giải quyết <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="resolution-comment"
              placeholder="Nhập ý kiến giải quyết của bạn..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              data-testid="input-resolution-comment"
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Ý kiến này sẽ được hiển thị công khai cho người dân xem
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            data-testid="button-cancel-resolution"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!comment.trim() || isPending}
            data-testid="button-submit-resolution"
          >
            {isPending ? "Đang xử lý..." : "Xác nhận đã xử lý"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
