import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ResolutionDialog from "@/components/ResolutionDialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, CheckCircle2, RotateCcw, User, Phone, MapPin, Calendar, Star } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Feedback } from "@shared/schema";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface StaffInfo {
  id: number;
  name: string;
  phone: string | null;
  username: string | null;
}

export default function StaffDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [staff, setStaff] = useState<StaffInfo | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "reopen";
    feedbackId: string;
  } | null>(null);
  const [resolutionDialogOpen, setResolutionDialogOpen] = useState(false);
  const [resolvingFeedbackId, setResolvingFeedbackId] = useState<string | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const staffData = localStorage.getItem("staff");
    if (!staffData) {
      navigate("/login");
      return;
    }
    try {
      setStaff(JSON.parse(staffData));
    } catch (error) {
      localStorage.removeItem("staff");
      navigate("/login");
    }
  }, [navigate]);

  // Fetch feedbacks for current staff only (scoped endpoint for security)
  const { data: myFeedbacks = [], isLoading } = useQuery<Feedback[]>({
    queryKey: staff ? [`/api/staff/${staff.id}/feedbacks`] : [],
    enabled: !!staff,
  });

  // Calculate statistics
  const stats = {
    total: myFeedbacks.length,
    received: myFeedbacks.filter((fb) => fb.status === "received").length,
    processing: myFeedbacks.filter((fb) => fb.status === "processing").length,
    resolved: myFeedbacks.filter((fb) => fb.status === "resolved").length,
  };

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, resolutionComment }: { id: string; status: string; resolutionComment?: string }) => {
      return await apiRequest("PATCH", `/api/feedbacks/${id}/status`, { status, resolutionComment });
    },
    onSuccess: () => {
      // Invalidate staff feedbacks query
      if (staff) {
        queryClient.invalidateQueries({ queryKey: [`/api/staff/${staff.id}/feedbacks`] });
      }
      toast({
        title: "Cập nhật thành công",
        description: "Trạng thái phản ánh đã được cập nhật",
      });
      setResolutionDialogOpen(false);
      setResolvingFeedbackId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Cập nhật thất bại",
        description: error.message || "Có lỗi xảy ra khi cập nhật trạng thái",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("staff");
    navigate("/login");
  };

  const handleResolve = (feedbackId: string) => {
    setResolvingFeedbackId(feedbackId);
    setResolutionDialogOpen(true);
  };

  const handleResolutionSubmit = (resolutionComment: string) => {
    if (!resolvingFeedbackId) return;
    updateStatusMutation.mutate({ 
      id: resolvingFeedbackId, 
      status: "resolved",
      resolutionComment 
    });
  };

  const handleReopen = (feedbackId: string) => {
    setConfirmAction({ type: "reopen", feedbackId });
  };

  const confirmStatusChange = () => {
    if (!confirmAction) return;
    updateStatusMutation.mutate({ id: confirmAction.feedbackId, status: "processing" });
    setConfirmAction(null);
  };

  if (!staff) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-950 border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary">Bảng điều khiển cán bộ</h1>
            <p className="text-sm text-muted-foreground">Xin chào, {staff.name}</p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            data-testid="button-staff-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Đăng xuất
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng số phản ánh</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đã tiếp nhận</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600" data-testid="stat-received">{stats.received}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đang xử lý</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600" data-testid="stat-processing">{stats.processing}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đã giải quyết</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="stat-resolved">{stats.resolved}</div>
            </CardContent>
          </Card>
        </div>

        {/* Feedbacks List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Phản ánh được phân công</h2>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : myFeedbacks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Chưa có phản ánh nào được phân công cho bạn
              </CardContent>
            </Card>
          ) : (
            myFeedbacks.map((feedback) => (
              <Card key={feedback.id} data-testid={`feedback-${feedback.id}`}>
                <CardHeader>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant={
                            feedback.status === "resolved"
                              ? "default"
                              : feedback.status === "processing"
                              ? "secondary"
                              : "outline"
                          }
                          className={
                            feedback.status === "resolved"
                              ? "bg-green-500"
                              : feedback.status === "processing"
                              ? "bg-amber-500"
                              : "bg-blue-500"
                          }
                          data-testid={`status-${feedback.id}`}
                        >
                          {feedback.status === "resolved"
                            ? "Đã giải quyết"
                            : feedback.status === "processing"
                            ? "Đang xử lý"
                            : "Đã tiếp nhận"}
                        </Badge>
                        <span className="text-sm font-mono text-muted-foreground">
                          #{feedback.trackingNumber}
                        </span>
                      </div>
                      <CardTitle className="text-lg">{feedback.title}</CardTitle>
                    </div>
                    <div className="flex gap-2">
                      {feedback.status === "processing" && (
                        <Button
                          size="sm"
                          onClick={() => handleResolve(feedback.id)}
                          disabled={updateStatusMutation.isPending}
                          data-testid={`button-resolve-${feedback.id}`}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Đã xử lý
                        </Button>
                      )}
                      {feedback.status === "resolved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReopen(feedback.id)}
                          disabled={updateStatusMutation.isPending}
                          data-testid={`button-reopen-${feedback.id}`}
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Xử lý lại
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{feedback.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Đơn vị:</span>
                        <span>{feedback.unitName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Người gửi:</span>
                        <span>{feedback.contactName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Số điện thoại:</span>
                        <span>{feedback.contactPhone}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Ngày gửi:</span>
                        <span>
                          {format(new Date(feedback.submittedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                        </span>
                      </div>
                      {feedback.rating && (
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-medium">Đánh giá:</span>
                          <span>{feedback.rating}/5 sao</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {feedback.imageUrl && (
                    <div>
                      <img
                        src={feedback.imageUrl}
                        alt="Hình ảnh phản ánh"
                        className="max-w-sm rounded border"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Resolution Dialog */}
      <ResolutionDialog
        open={resolutionDialogOpen}
        onOpenChange={setResolutionDialogOpen}
        onSubmit={handleResolutionSubmit}
        isPending={updateStatusMutation.isPending}
      />

      {/* Reopen Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xử lý lại</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn chuyển phản ánh này về trạng thái đang xử lý không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-status-change">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusChange}
              data-testid="button-confirm-status-change"
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
