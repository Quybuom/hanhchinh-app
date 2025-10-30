import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Loader2, LogOut, CheckCircle2, RotateCcw, User, Phone, MapPin, Calendar, Star, Edit2, CheckCircle, Search } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");

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

  // Get available years from feedbacks
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    myFeedbacks.forEach(feedback => {
      const year = new Date(feedback.submittedAt).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [myFeedbacks]);

  // Filter feedbacks
  const filteredFeedbacks = useMemo(() => {
    let result = myFeedbacks;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(feedback => {
        const unitName = feedback.unitName?.toLowerCase() || "";
        const contactName = feedback.contactName?.toLowerCase() || "";
        const title = feedback.title?.toLowerCase() || "";
        return unitName.includes(query) || contactName.includes(query) || title.includes(query);
      });
    }
    
    // Filter by year
    if (selectedYear !== "all") {
      result = result.filter(feedback => {
        const year = new Date(feedback.submittedAt).getFullYear();
        return year === parseInt(selectedYear);
      });
    }
    
    // Filter by month
    if (selectedMonth !== "all") {
      result = result.filter(feedback => {
        const month = new Date(feedback.submittedAt).getMonth() + 1;
        return month === parseInt(selectedMonth);
      });
    }
    
    return result;
  }, [myFeedbacks, searchQuery, selectedYear, selectedMonth]);

  // Calculate statistics from filtered feedbacks
  const stats = {
    total: filteredFeedbacks.length,
    received: filteredFeedbacks.filter((fb) => fb.status === "received").length,
    processing: filteredFeedbacks.filter((fb) => fb.status === "processing").length,
    resolved: filteredFeedbacks.filter((fb) => fb.status === "resolved").length,
  };

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, resolutionComment, resolutionImageUrl }: { id: string; status: string; resolutionComment?: string; resolutionImageUrl?: string }) => {
      return await apiRequest("PATCH", `/api/feedbacks/${id}/status`, { status, resolutionComment, resolutionImageUrl });
    },
    onSuccess: () => {
      // Invalidate staff feedbacks query
      if (staff) {
        queryClient.invalidateQueries({ queryKey: [`/api/staff/${staff.id}/feedbacks`] });
      }
      // Also invalidate public feedbacks to update home page in real-time
      queryClient.invalidateQueries({ queryKey: ["/api/feedbacks"] });
      
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
    navigate("/");
  };

  const handleResolve = (feedbackId: string) => {
    setResolvingFeedbackId(feedbackId);
    setResolutionDialogOpen(true);
  };

  const handleEditResolution = (feedbackId: string) => {
    setResolvingFeedbackId(feedbackId);
    setResolutionDialogOpen(true);
  };

  const handleResolutionSubmit = (resolutionComment: string, resolutionImageUrl?: string) => {
    if (!resolvingFeedbackId) return;
    updateStatusMutation.mutate({ 
      id: resolvingFeedbackId, 
      status: "resolved",
      resolutionComment,
      resolutionImageUrl
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
              <CardTitle className="text-sm font-medium">Tổng số yêu cầu hỗ trợ</CardTitle>
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

        {/* Search and Filter Section */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Tìm kiếm theo địa bàn, tên người gửi hoặc tiêu đề..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-staff"
              />
            </div>
            
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger data-testid="select-year-staff">
                <SelectValue placeholder="Chọn năm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả các năm</SelectItem>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger data-testid="select-month-staff">
                <SelectValue placeholder="Chọn tháng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả các tháng</SelectItem>
                <SelectItem value="1">Tháng 1</SelectItem>
                <SelectItem value="2">Tháng 2</SelectItem>
                <SelectItem value="3">Tháng 3</SelectItem>
                <SelectItem value="4">Tháng 4</SelectItem>
                <SelectItem value="5">Tháng 5</SelectItem>
                <SelectItem value="6">Tháng 6</SelectItem>
                <SelectItem value="7">Tháng 7</SelectItem>
                <SelectItem value="8">Tháng 8</SelectItem>
                <SelectItem value="9">Tháng 9</SelectItem>
                <SelectItem value="10">Tháng 10</SelectItem>
                <SelectItem value="11">Tháng 11</SelectItem>
                <SelectItem value="12">Tháng 12</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {(searchQuery || selectedYear !== "all" || selectedMonth !== "all") && (
            <p className="text-sm text-muted-foreground">
              Tìm thấy {filteredFeedbacks.length} kết quả
            </p>
          )}
        </div>

        {/* Feedbacks List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Phản ánh được phân công</h2>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : filteredFeedbacks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {myFeedbacks.length === 0 
                  ? "Chưa có phản ánh nào được phân công cho bạn"
                  : "Không tìm thấy phản ánh nào phù hợp"}
              </CardContent>
            </Card>
          ) : (
            filteredFeedbacks.map((feedback) => (
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
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleEditResolution(feedback.id)}
                            disabled={updateStatusMutation.isPending}
                            data-testid={`button-edit-resolution-${feedback.id}`}
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Chỉnh sửa ý kiến
                          </Button>
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
                        </>
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

                  {/* Resolution Comment Display */}
                  {feedback.resolutionComment && feedback.status === "resolved" && (
                    <div className="border-t border-card-border pt-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-foreground">Ý kiến giải quyết:</span>
                        </div>
                        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 rounded-md p-3 space-y-3">
                          <p className="text-sm text-foreground" data-testid={`feedback-resolution-${feedback.id}`}>
                            {feedback.resolutionComment}
                          </p>
                          {feedback.resolutionImageUrl && (
                            <div className="rounded-md overflow-hidden border border-green-300 dark:border-green-800">
                              <img
                                src={feedback.resolutionImageUrl}
                                alt="Hình ảnh giải quyết"
                                className="w-full h-auto max-h-64 object-cover"
                                data-testid={`feedback-resolution-image-${feedback.id}`}
                              />
                            </div>
                          )}
                        </div>
                      </div>
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
        initialComment={
          resolvingFeedbackId 
            ? myFeedbacks.find(f => f.id === resolvingFeedbackId)?.resolutionComment || ""
            : ""
        }
        initialImageUrl={
          resolvingFeedbackId
            ? myFeedbacks.find(f => f.id === resolvingFeedbackId)?.resolutionImageUrl || ""
            : ""
        }
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
