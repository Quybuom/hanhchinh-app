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
import { Building2, Calendar, User } from "lucide-react";
import type { Feedback } from "@shared/schema";
import { Status, STATUS_OPTIONS, ASSIGNEES } from "@shared/schema";

interface FeedbackCardProps {
  feedback: Feedback;
  onUpdateStatus: (id: string, status: Status) => void;
  onAssign: (id: string, assignee: string) => void;
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

const getStatusLabel = (status: Status) => {
  return STATUS_OPTIONS.find((opt) => opt.value === status)?.label || status;
};

export default function FeedbackCard({
  feedback,
  onUpdateStatus,
  onAssign,
  isAdminMode,
}: FeedbackCardProps) {
  const timeAgo = formatDistanceToNow(new Date(feedback.submittedAt), {
    addSuffix: true,
    locale: vi,
  });

  return (
    <Card className="hover-elevate transition-all" data-testid={`feedback-card-${feedback.id}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="w-4 h-4" />
            <span data-testid={`feedback-unit-${feedback.id}`}>{feedback.unitName}</span>
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
      </CardContent>

      <CardFooter className="pt-4 border-t border-card-border flex flex-wrap items-center gap-3">
        <Badge variant={getStatusBadgeVariant(feedback.status)} data-testid={`feedback-status-badge-${feedback.id}`}>
          {getStatusLabel(feedback.status)}
        </Badge>

        {feedback.assignee && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span data-testid={`feedback-assignee-${feedback.id}`}>{feedback.assignee}</span>
          </div>
        )}

        {isAdminMode && (
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <Select
              value={feedback.status}
              onValueChange={(value) => onUpdateStatus(feedback.id, value as Status)}
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

            <Select
              value={feedback.assignee || "unassigned"}
              onValueChange={(value) => onAssign(feedback.id, value === "unassigned" ? "" : value)}
            >
              <SelectTrigger className="w-[180px]" data-testid={`select-assignee-${feedback.id}`}>
                <SelectValue placeholder="Chưa phân công" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Chưa phân công</SelectItem>
                {ASSIGNEES.map((assignee) => (
                  <SelectItem key={assignee} value={assignee}>
                    {assignee}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
