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
import { CheckCircle2, Upload, X, Loader2 } from "lucide-react";

interface ResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (resolutionComment: string, resolutionImageUrl?: string) => void;
  isPending?: boolean;
}

export default function ResolutionDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending = false,
}: ResolutionDialogProps) {
  const [comment, setComment] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file ảnh");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Kích thước file không được vượt quá 5MB");
      return;
    }

    setSelectedFile(file);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setUploadedImageUrl(data.url);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Lỗi khi tải lên hình ảnh");
      setSelectedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setUploadedImageUrl(null);
  };

  const handleSubmit = () => {
    onSubmit(comment.trim(), uploadedImageUrl || undefined);
    setComment("");
    setSelectedFile(null);
    setUploadedImageUrl(null);
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

          <div className="space-y-2">
            <Label htmlFor="resolution-image">
              Hình ảnh đính kèm (không bắt buộc)
            </Label>
            {!selectedFile && !uploadedImageUrl && (
              <div className="border-2 border-dashed border-card-border rounded-md p-4 hover-elevate transition-all">
                <label
                  htmlFor="resolution-image"
                  className="flex flex-col items-center gap-2 cursor-pointer"
                  data-testid="label-upload-resolution-image"
                >
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Nhấp để tải lên hình ảnh
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (Tối đa 5MB)
                  </span>
                  <input
                    id="resolution-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isUploading || isPending}
                    data-testid="input-resolution-image"
                  />
                </label>
              </div>
            )}

            {isUploading && (
              <div className="flex items-center justify-center p-4 border rounded-md">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Đang tải lên...
                </span>
              </div>
            )}

            {uploadedImageUrl && (
              <div className="relative rounded-md overflow-hidden border">
                <img
                  src={uploadedImageUrl}
                  alt="Resolution preview"
                  className="w-full h-auto max-h-64 object-cover"
                  data-testid="preview-resolution-image"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveImage}
                  disabled={isPending}
                  data-testid="button-remove-resolution-image"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
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
