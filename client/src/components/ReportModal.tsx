import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Feedback } from "@shared/schema";
import { Status } from "@shared/schema";
import { BarChart3, TrendingUp, Users, Download, FileText } from "lucide-react";
import { useState } from "react";

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
  const [isExporting, setIsExporting] = useState(false);

  const totalCount = feedbackItems.length;
  const receivedCount = feedbackItems.filter((f) => f.status === Status.Received).length;
  const processingCount = feedbackItems.filter((f) => f.status === Status.Processing).length;
  const resolvedCount = feedbackItems.filter((f) => f.status === Status.Resolved).length;

  const assignedCount = feedbackItems.filter((f) => f.assignee).length;
  const unassignedCount = totalCount - assignedCount;

  const resolutionRate = totalCount > 0 ? ((resolvedCount / totalCount) * 100).toFixed(1) : "0";
  const receivedRate = totalCount > 0 ? ((receivedCount / totalCount) * 100).toFixed(1) : "0";
  const processingRate = totalCount > 0 ? ((processingCount / totalCount) * 100).toFixed(1) : "0";
  
  // Calculate assignee statistics
  const assigneeStats = feedbackItems.reduce((acc, feedback) => {
    const assignee = feedback.assignee || "Chưa phân công";
    if (!acc[assignee]) {
      acc[assignee] = { total: 0, resolved: 0 };
    }
    acc[assignee].total++;
    if (feedback.status === Status.Resolved) {
      acc[assignee].resolved++;
    }
    return acc;
  }, {} as Record<string, { total: number; resolved: number }>);

  const assigneeList = Object.entries(assigneeStats)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([name, stats]) => ({
      name,
      total: stats.total,
      resolved: stats.resolved,
      rate: stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(1) : "0"
    }));

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/export/csv");
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `phan-anh-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      alert("Lỗi khi xuất file CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/export/report");
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bao-cao-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting report:", error);
      alert("Lỗi khi xuất báo cáo");
    } finally {
      setIsExporting(false);
    }
  };

  const stats = [
    {
      label: "Tổng phản ánh",
      value: totalCount,
      percentage: null,
      icon: BarChart3,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Mới tiếp nhận",
      value: receivedCount,
      percentage: receivedRate,
      icon: TrendingUp,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    },
    {
      label: "Đang xử lý",
      value: processingCount,
      percentage: processingRate,
      icon: TrendingUp,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
    {
      label: "Đã xử lý",
      value: resolvedCount,
      percentage: resolutionRate,
      icon: TrendingUp,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      label: "Đã phân công",
      value: assignedCount,
      percentage: null,
      icon: Users,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      label: "Chưa phân công",
      value: unassignedCount,
      percentage: null,
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
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                          {stat.percentage && (
                            <p className="text-sm text-muted-foreground">({stat.percentage}%)</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {assigneeList.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Thống kê theo cán bộ</h3>
              <div className="space-y-2">
                {assigneeList.map((assignee) => (
                  <Card key={assignee.name}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {assignee.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {assignee.resolved}/{assignee.total} đã xử lý ({assignee.rate}%)
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-foreground">{assignee.total}</p>
                          <p className="text-xs text-muted-foreground">phản ánh</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleExportReport}
            disabled={isExporting || totalCount === 0}
            data-testid="button-export-report"
          >
            <FileText className="mr-2 w-4 h-4" />
            Xuất báo cáo (.txt)
          </Button>
          <Button
            onClick={handleExportCSV}
            disabled={isExporting || totalCount === 0}
            data-testid="button-export-csv"
          >
            <Download className="mr-2 w-4 h-4" />
            Xuất dữ liệu (.csv)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
