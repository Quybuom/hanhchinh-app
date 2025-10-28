import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Building2, Calendar, User, Trash2, Edit, Hash, Star, MessageSquare } from "lucide-react";
import type { Feedback } from "@shared/schema";
import { Status, STATUS_OPTIONS } from "@shared/schema";
import AssigneeInput from "./AssigneeInput";
import { Button } from "@/components/ui/button";
import ReviewDialog from "./ReviewDialog";

interface FeedbackCardProps {
  feedback: Feedback;
  onUpdateStatus: (id: string, status: Status) => void;
  onAssign: (id: string, assignee: string) => void;
  onEdit?: (feedback: Feedback) => void;
  onDelete?: (id: string) => void;
  onReviewSubmit?: () => void;
  isAdminMode: boolean;
}

const getStatusBadgeVariant = (status: Status) => {
  switch (status) {
    case Status.Received:
      return "secondary";
    case Status.Processing:
      return "default";
    case Status.Resolved:
      return "outline";
    default:
      return "secondary";
  }
};

const getStatusCardClass = (status: Status) => {
  switch (status) {
    case Status.Received:
      return "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50";
    case Status.Processing:
      return "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50";
    case Status.Resolved:
      return "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50";
    default:
      return "";
  }
};

const getStatusLabel = (status: Status) => {
  return STATUS_OPTIONS.find((opt) => opt.value === status)?.label || status;
};

export default function FeedbackCard({
  feedback,
  onUpdateStatus,
  onAssign,
  onEdit,
  onDelete,
  onReviewSubmit,
  isAdminMode,
}: FeedbackCardProps) {
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  
  const timeAgo = formatDistanceToNow(new Date(feedback.submittedAt), {
    addSuffix: true,
    locale: vi,
  });

  const feedbackStatus = feedback.status as Status;
  const hasRating = feedback.rating !== null && feedback.rating !== undefined;
  const canReview = feedbackStatus === Status.Resolved && !hasRating;

  return (
    <Card className={`hover-elevate transition-all ${getStatusCardClass(feedbackStatus)}`} data-testid={`feedback-card-${feedback.id}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1 font-mono" data-testid={`feedback-tracking-${feedback.id}`}>
              <Hash className="w-3 h-3" />
              {feedback.trackingNumber}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="w-4 h-4" />
              <span data-testid={`feedback-unit-${feedback.id}`}>{feedback.unitName}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span data-testid={`feedback-time-${feedback.id}`}>{timeAgo}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2" data-testid={`feedback-title-${feedback.id}`}>
            {feedback.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed" data-testid={`feedback-description-${feedback.id}`}>
            {feedback.description}
          </p>
        </div>

        {feedback.imageUrl && (
          <div className="rounded-md overflow-hidden">
            <img
              src={feedback.imageUrl}
              alt="Hình ảnh đính kèm"
              className="w-full h-auto max-h-64 object-cover"
              data-testid={`feedback-image-${feedback.id}`}
            />
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-sm pt-3 border-t border-card-border/50">
          {feedback.contactName && (
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 mt-0.5 text-primary" />
              <div>
                <span className="font-medium text-foreground">Người gửi:</span>
                <span className="ml-1 text-muted-foreground" data-testid={`feedback-contact-name-${feedback.id}`}>
                  {feedback.contactName}
                </span>
              </div>
            </div>
          )}
          <div className="flex items-start gap-2">
            <Building2 className="w-4 h-4 mt-0.5 text-primary" />
            <div>
              <span className="font-medium text-foreground">Đơn vị:</span>
              <span className="ml-1 text-muted-foreground" data-testid={`feedback-unit-detail-${feedback.id}`}>
                {feedback.unitName}
              </span>
            </div>
          </div>
          {feedback.assignee && (
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 mt-0.5 text-primary" />
              <div>
                <span className="font-medium text-foreground">Cán bộ xử lý:</span>
                <span className="ml-1 text-muted-foreground" data-testid={`feedback-assignee-detail-${feedback.id}`}>
                  {feedback.assignee}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Rating Display */}
        {hasRating && (
          <div className="pt-4 border-t border-card-border/50">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-foreground">Đánh giá:</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= (feedback.rating || 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({feedback.rating}/5)
                  </span>
                </div>
                {feedback.reviewComment && (
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground italic">
                      "{feedback.reviewComment}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-4 border-t border-card-border flex flex-wrap items-center gap-3">
        <Badge variant={getStatusBadgeVariant(feedbackStatus)} data-testid={`feedback-status-badge-${feedback.id}`}>
          {getStatusLabel(feedbackStatus)}
        </Badge>

        {/* Review Button for Public Users */}
        {!isAdminMode && canReview && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsReviewDialogOpen(true)}
            data-testid={`button-review-${feedback.id}`}
            className="ml-auto"
          >
            <Star className="w-4 h-4 mr-2" />
            Đánh giá
          </Button>
        )}

        {isAdminMode && (
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit?.(feedback)}
              data-testid={`button-edit-${feedback.id}`}
            >
              <Edit className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete?.(feedback.id)}
              data-testid={`button-delete-${feedback.id}`}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>

            <Select
              value={feedbackStatus}
              onValueChange={(value) => {
                if (value === Status.Received || value === Status.Processing || value === Status.Resolved) {
                  onUpdateStatus(feedback.id, value);
                }
              }}
            >
              <SelectTrigger className="w-[150px]" data-testid={`select-status-${feedback.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <AssigneeInput
              value={feedback.assignee}
              onChange={(value) => onAssign(feedback.id, value)}
              testId={`select-assignee-${feedback.id}`}
            />
          </div>
        )}
      </CardFooter>

      {/* Review Dialog */}
      <ReviewDialog
        feedbackId={feedback.id}
        isOpen={isReviewDialogOpen}
        onClose={() => setIsReviewDialogOpen(false)}
        onSuccess={() => {
          onReviewSubmit?.();
        }}
      />
    </Card>
  );
}
