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
import { Loader2 } from "lucide-react";

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

  const form = useForm<InsertFeedback>({
    resolver: zodResolver(insertFeedbackSchema),
    defaultValues: {
      unitName: "",
      title: "",
      description: "",
      imageUrl: "",
    },
  });

  const handleSubmit = async (data: InsertFeedback) => {
    setIsSubmitting(true);
    try {
      await onAddFeedback({
        unitName: data.unitName,
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl || null,
      });
      form.reset();
      onClose();
    } catch (error) {
      console.error("Error adding feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl" data-testid="modal-add-feedback">
        <DialogHeader>
          <DialogTitle>Gửi phản ánh mới</DialogTitle>
          <DialogDescription>
            Điền thông tin phản ánh của bạn vào biểu mẫu dưới đây
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="unitName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên đơn vị</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ví dụ: Phòng Kế hoạch - Tài chính"
                      data-testid="input-unit-name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiêu đề</FormLabel>
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
                  <FormLabel>Mô tả chi tiết</FormLabel>
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

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link hình ảnh (tùy chọn)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      data-testid="input-image-url"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                data-testid="button-cancel"
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting} data-testid="button-submit">
                {isSubmitting && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                Gửi phản ánh
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
