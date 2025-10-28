import FeedbackCard from "./FeedbackCard";
import type { Feedback } from "@shared/schema";
import { Status } from "@shared/schema";
import { FileQuestion } from "lucide-react";

interface FeedbackListProps {
  feedbackItems: Feedback[];
  onUpdateStatus: (id: string, status: Status) => void;
  onAssign: (id: string, assignee: string) => void;
  onEdit?: (feedback: Feedback) => void;
  onDelete?: (id: string) => void;
  onReviewSubmit?: () => void;
  isAdminMode: boolean;
}

export default function FeedbackList({
  feedbackItems,
  onUpdateStatus,
  onAssign,
  onEdit,
  onDelete,
  onReviewSubmit,
  isAdminMode,
}: FeedbackListProps) {
  if (feedbackItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4" data-testid="empty-state">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
          <FileQuestion className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Chưa có phản ánh nào
        </h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Hiện tại chưa có yêu cầu nào được gửi đến hệ thống. Nhấn nút "GỬI YÊU CẦU HỖ TRỢ" để thêm yêu cầu mới.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="feedback-list">
      {feedbackItems.map((feedback) => (
        <FeedbackCard
          key={feedback.id}
          feedback={feedback}
          onUpdateStatus={onUpdateStatus}
          onAssign={onAssign}
          onEdit={onEdit}
          onDelete={onDelete}
          onReviewSubmit={onReviewSubmit}
          isAdminMode={isAdminMode}
        />
      ))}
    </div>
  );
}
