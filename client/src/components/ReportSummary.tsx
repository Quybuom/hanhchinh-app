import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock, Inbox } from "lucide-react";
import type { Feedback } from "@shared/schema";
import { Status } from "@shared/schema";

interface ReportSummaryProps {
  feedbackItems: Feedback[];
}

export default function ReportSummary({ feedbackItems }: ReportSummaryProps) {
  const totalCount = feedbackItems.length;
  const receivedCount = feedbackItems.filter((item) => item.status === Status.Received).length;
  const processingCount = feedbackItems.filter((item) => item.status === Status.Processing).length;
  const resolvedCount = feedbackItems.filter((item) => item.status === Status.Resolved).length;

  const stats = [
    {
      label: "Tổng số phản ánh",
      value: totalCount,
      icon: Inbox,
      color: "text-primary",
      bgColor: "bg-primary/10",
      testId: "stat-total"
    },
    {
      label: "Đang xử lý",
      value: processingCount,
      icon: Clock,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
      testId: "stat-processing"
    },
    {
      label: "Đã xử lý",
      value: resolvedCount,
      icon: CheckCircle2,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
      testId: "stat-resolved"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="hover-elevate transition-all" data-testid={stat.testId}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-foreground" data-testid={`${stat.testId}-value`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
