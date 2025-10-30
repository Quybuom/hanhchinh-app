import { useState, useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Feedback, InsertFeedback } from "@shared/schema";
import { Status } from "@shared/schema";
import Header from "@/components/Header";
import ReportSummary from "@/components/ReportSummary";
import FeedbackList from "@/components/FeedbackList";
import AddFeedbackModal from "@/components/AddFeedbackModal";
import EditFeedbackModal from "@/components/EditFeedbackModal";
import ReportModal from "@/components/ReportModal";
import StaffManagementModal from "@/components/StaffManagementModal";
import Toast from "@/components/Toast";
import AdminAuthModal from "@/components/AdminAuthModal";
import { Loader2, Search, Calendar as CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Home() {
  const [, navigate] = useLocation();
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [isStaffManagementOpen, setStaffManagementOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAdminMode, setAdminMode] = useState(false);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");

  // Check admin session on mount
  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        const response = await fetch("/api/admin/session");
        const data = await response.json();
        if (data.isAdmin) {
          setAdminMode(true);
        }
      } catch (error) {
        console.error("Error checking admin session:", error);
      }
    };
    checkAdminSession();
  }, []);

  const { data: feedbackItems = [], isLoading } = useQuery<Feedback[]>({
    queryKey: ["/api/feedbacks"],
  });

  // Get available years and months from feedbacks
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    feedbackItems.forEach(feedback => {
      const year = new Date(feedback.submittedAt).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [feedbackItems]);

  const filteredFeedbacks = useMemo(() => {
    let result = feedbackItems;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(feedback => {
        const unitName = feedback.unitName?.toLowerCase() || "";
        const contactName = feedback.contactName?.toLowerCase() || "";
        return unitName.includes(query) || contactName.includes(query);
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
  }, [feedbackItems, searchQuery, selectedYear, selectedMonth]);

  const addFeedbackMutation = useMutation({
    mutationFn: async (data: Omit<InsertFeedback, 'status' | 'assignee'>) => {
      const response = await apiRequest("POST", "/api/feedbacks", data);
      return await response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/feedbacks"] });
      if (data && typeof data === 'object' && 'message' in data) {
        setToastMessage(data.message);
      } else {
        setToastMessage("Yêu cầu hỗ trợ đã được gửi thành công");
      }
    },
    onError: () => {
      setToastMessage("Lỗi khi gửi yêu cầu hỗ trợ");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const response = await apiRequest("PATCH", `/api/feedbacks/${id}/status`, { status });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feedbacks"] });
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ id, assignee }: { id: string; assignee: string | null }) => {
      const response = await apiRequest("PATCH", `/api/feedbacks/${id}/assign`, { assignee });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feedbacks"] });
    },
  });

  const updateFeedbackMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertFeedback> }) => {
      const response = await apiRequest("PATCH", `/api/feedbacks/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feedbacks"] });
      setToastMessage("Phản ánh đã được cập nhật");
    },
    onError: () => {
      setToastMessage("Lỗi khi cập nhật phản ánh");
    },
  });

  const deleteFeedbackMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/feedbacks/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feedbacks"] });
      setToastMessage("Phản ánh đã được xóa");
    },
    onError: () => {
      setToastMessage("Lỗi khi xóa phản ánh");
    },
  });

  const handleAddFeedback = useCallback(
    async (data: Omit<InsertFeedback, 'status' | 'assignee'>) => {
      await addFeedbackMutation.mutateAsync(data);
    },
    [addFeedbackMutation]
  );

  const handleUpdateStatus = useCallback(
    (id: string, status: Status) => {
      updateStatusMutation.mutate({ id, status });
    },
    [updateStatusMutation]
  );

  const handleAssign = useCallback(
    (id: string, assignee: string) => {
      assignMutation.mutate({ id, assignee: assignee || null });
    },
    [assignMutation]
  );

  const handleEditFeedback = useCallback(
    (feedback: Feedback) => {
      setSelectedFeedback(feedback);
      setEditModalOpen(true);
    },
    []
  );

  const handleUpdateFeedback = useCallback(
    async (id: string, data: Partial<InsertFeedback>) => {
      await updateFeedbackMutation.mutateAsync({ id, data });
    },
    [updateFeedbackMutation]
  );

  const handleDeleteFeedback = useCallback(
    (id: string) => {
      if (confirm("Bạn có chắc chắn muốn xóa phản ánh này?")) {
        deleteFeedbackMutation.mutate(id);
      }
    },
    [deleteFeedbackMutation]
  );

  const handleAuthenticate = async (password: string): Promise<boolean> => {
    try {
      const response = await apiRequest("POST", "/api/admin/login", { password });
      const data = await response.json();
      if (data && data.success) {
        setAdminMode(true);
        setAuthModalOpen(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Authentication failed:", error);
      return false;
    }
  };

  const handleAdminLogout = async () => {
    try {
      await apiRequest("POST", "/api/admin/logout", {});
      setAdminMode(false);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const handleReviewSubmit = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/feedbacks"] });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header
        onAddFeedback={() => setAddModalOpen(true)}
        onShowReport={() => setReportModalOpen(true)}
        onShowStaffManagement={() => setStaffManagementOpen(true)}
        onAdminLoginClick={() => navigate("/login")}
        onAdminLogout={handleAdminLogout}
        isAdminMode={isAdminMode}
      />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 w-full flex-grow">
        <ReportSummary feedbackItems={filteredFeedbacks} />
        
        {/* Search and Filter Section */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Tìm kiếm theo địa bàn hoặc tên người gửi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger data-testid="select-year">
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
              <SelectTrigger data-testid="select-month">
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
        
        <FeedbackList
          feedbackItems={filteredFeedbacks}
          onUpdateStatus={handleUpdateStatus}
          onAssign={handleAssign}
          onEdit={handleEditFeedback}
          onDelete={handleDeleteFeedback}
          onReviewSubmit={handleReviewSubmit}
          isAdminMode={isAdminMode}
        />
      </main>

      <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border">
        Đơn vị thực hiện: Trung tâm Phục vụ hành chính công tỉnh Bắc Ninh
      </footer>

      <AddFeedbackModal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAddFeedback={handleAddFeedback}
      />

      <EditFeedbackModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedFeedback(null);
        }}
        feedback={selectedFeedback}
        onUpdateFeedback={handleUpdateFeedback}
      />

      {isAdminMode && (
        <>
          <ReportModal
            isOpen={isReportModalOpen}
            onClose={() => setReportModalOpen(false)}
            feedbackItems={feedbackItems}
          />
          <StaffManagementModal
            isOpen={isStaffManagementOpen}
            onClose={() => setStaffManagementOpen(false)}
          />
        </>
      )}

      <AdminAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthenticate={handleAuthenticate}
      />

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
}
