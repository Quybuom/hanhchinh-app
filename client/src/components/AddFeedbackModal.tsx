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
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFeedbackSchema, type InsertFeedback } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Upload, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AddFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFeedback: (feedback: Omit<InsertFeedback, 'status' | 'assignee'>) => Promise<void>;
}

export default function AddFeedbackModal({
  isOpen,
  onClose,
  onAddFeedback,
}: AddFeedbackModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<InsertFeedback>({
    resolver: zodResolver(insertFeedbackSchema),
    defaultValues: {
      unitName: "",
      title: "",
      description: "",
      imageUrl: null,
      contactName: "",
      contactPhone: "",
    },
  });

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
      form.setValue("imageUrl", data.url);
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
    form.setValue("imageUrl", null);
  };

  const handleSubmit = async (data: InsertFeedback) => {
    setIsSubmitting(true);
    try {
      await onAddFeedback({
        unitName: data.unitName,
        title: data.title,
        description: data.description,
        imageUrl: uploadedImageUrl || null,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
      });
      form.reset();
      setSelectedFile(null);
      setUploadedImageUrl(null);
      onClose();
    } catch (error) {
      console.error("Error adding feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col" data-testid="modal-add-feedback">
        <DialogHeader>
          <DialogTitle>Gửi yêu cầu hỗ trợ</DialogTitle>
          <DialogDescription>
            Điền thông tin yêu cầu hỗ trợ của bạn vào biểu mẫu dưới đây
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="space-y-6 overflow-y-auto pr-2 flex-1">
            <FormField
              control={form.control}
              name="unitName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Tên đơn vị <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ví dụ: UBND xã Quế Võ, UBND phường Đông Ngàn"
                      data-testid="input-unit-name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 p-4 rounded-md border border-card-border bg-muted/30">
              <h3 className="text-sm font-semibold text-foreground">Thông tin liên hệ</h3>
              
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Họ và tên <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ví dụ: Nguyễn Văn A"
                        data-testid="input-contact-name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Số điện thoại <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ví dụ: 0987654321"
                        data-testid="input-contact-phone"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Tiêu đề <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Tóm tắt ngắn gọn vấn đề"
                      data-testid="input-title"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Mô tả chi tiết <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Mô tả chi tiết về vấn đề hoặc đề xuất của bạn"
                      className="min-h-32 resize-none"
                      data-testid="input-description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Hình ảnh (tùy chọn)</FormLabel>
              {!selectedFile && !uploadedImageUrl && (
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="file-upload"
                    className="flex items-center justify-center gap-2 px-4 py-2 border border-input rounded-md cursor-pointer hover-elevate active-elevate-2 transition-colors"
                    data-testid="button-choose-file"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Chọn file ảnh</span>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    data-testid="input-file"
                  />
                  <span className="text-sm text-muted-foreground">
                    (Tối đa 5MB)
                  </span>
                </div>
              )}

              {isUploading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tải lên...</span>
                </div>
              )}

              {uploadedImageUrl && selectedFile && (
                <div className="relative inline-block">
                  <img
                    src={uploadedImageUrl}
                    alt="Preview"
                    className="max-w-xs max-h-48 rounded-md border"
                    data-testid="img-preview"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                    data-testid="button-remove-image"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                data-testid="button-cancel"
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting || isUploading} data-testid="button-submit">
                {isSubmitting && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                GỬI YÊU CẦU HỖ TRỢ
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
