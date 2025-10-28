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
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ReviewDialogProps {
  feedbackId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewDialog({
  feedbackId,
  isOpen,
  onClose,
  onSuccess,
}: ReviewDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        variant: "destructive",
        title: "Vui lòng chọn số sao đánh giá",
      });
      return;
    }

    if (!contactPhone || !/^[0-9]{10,11}$/.test(contactPhone)) {
      toast({
        variant: "destructive",
        title: "Số điện thoại không hợp lệ",
        description: "Vui lòng nhập số điện thoại 10-11 chữ số",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("POST", `/api/feedbacks/${feedbackId}/review`, {
        rating,
        reviewComment: reviewComment || undefined,
        contactPhone,
      });

      toast({
        title: "Đánh giá thành công",
        description: "Cảm ơn bạn đã đánh giá!",
      });
      
      setRating(0);
      setReviewComment("");
      setContactPhone("");
      onSuccess();
      onClose();
    } catch (error: any) {
      // Parse error message from server response
      let errorMessage = "Không thể gửi đánh giá";
      
      if (error && error.message && typeof error.message === "string") {
        // Error format from apiRequest: "status: responseText"
        // Extract JSON from error message
        const parts = error.message.split(": ", 2);
        if (parts.length === 2) {
          try {
            const jsonData = JSON.parse(parts[1]);
            if (jsonData && jsonData.error) {
              errorMessage = jsonData.error;
            }
          } catch {
            // If not JSON, use the raw message
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
      <DialogContent data-testid="modal-review" className="max-w-md">
        <DialogHeader>
          <DialogTitle>Đánh giá kết quả xử lý</DialogTitle>
          <DialogDescription>
            Vui lòng đánh giá mức độ hài lòng của bạn về kết quả xử lý
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Rating Stars */}
          <div className="space-y-2">
            <Label>Mức độ hài lòng</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  data-testid={`star-${star}`}
                  className="focus:outline-none transition-transform hover:scale-110"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground">
                Bạn đã chọn {rating} sao
              </p>
            )}
          </div>

          {/* Review Comment */}
          <div className="space-y-2">
            <Label htmlFor="review-comment">Nhận xét (tùy chọn)</Label>
            <Textarea
              id="review-comment"
              data-testid="input-review-comment"
              placeholder="Chia sẻ thêm về trải nghiệm của bạn..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={4}
            />
          </div>

          {/* Phone Verification */}
          <div className="space-y-2">
            <Label htmlFor="contact-phone">
              Số điện thoại xác minh <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contact-phone"
              data-testid="input-verify-phone"
              type="tel"
              placeholder="Nhập số điện thoại của bạn"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Nhập số điện thoại bạn đã dùng khi gửi kiến nghị để xác minh
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            data-testid="button-cancel"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            data-testid="button-submit-review"
          >
            {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
