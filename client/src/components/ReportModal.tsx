import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import type { Feedback } from "@shared/schema";
import { Status } from "@shared/schema";
import { BarChart3, TrendingUp, Users } from "lucide-react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedbackItems: Feedback[];
}

export default function ReportModal({
  isOpen,
  onClose,
  feedbackItems,
}: ReportModalProps) {
  const totalCount = feedbackItems.length;
  const receivedCount = feedbackItems.filter((f) => f.status === Status.Received).length;
  const processingCount = feedbackItems.filter((f) => f.status === Status.Processing).length;
  const resolvedCount = feedbackItems.filter((f) => f.status === Status.Resolved).length;

  const assignedCount = feedbackItems.filter((f) => f.assignee).length;
  const unassignedCount = totalCount - assignedCount;

  const resolutionRate = totalCount > 0 ? ((resolvedCount / totalCount) * 100).toFixed(1) : "0";

  const stats = [
    {
      label: "Tổng phản ánh",
      value: totalCount,
      icon: BarChart3,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Mới tiếp nhận",
      value: receivedCount,
      icon: TrendingUp,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    },
    {
      label: "Đang xử lý",
      value: processingCount,
      icon: TrendingUp,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
    {
      label: "Đã xử lý",
      value: resolvedCount,
      icon: TrendingUp,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      label: "Đã phân công",
      value: assignedCount,
      icon: Users,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      label: "Chưa phân công",
      value: unassignedCount,
      icon: Users,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto" data-testid="modal-report">
        <DialogHeader>
          <DialogTitle>Báo cáo tổng hợp</DialogTitle>
          <DialogDescription>
            Thống kê tình hình xử lý phản ánh
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Tỷ lệ hoàn thành
                  </p>
                  <p className="text-4xl font-bold text-foreground" data-testid="resolution-rate">
                    {resolutionRate}%
                  </p>
                </div>
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-chart-2/10">
                  <BarChart3 className="w-8 h-8 text-chart-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-md ${stat.bgColor}`}>
                        <Icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
