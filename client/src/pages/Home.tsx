import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Feedback, InsertFeedback } from "@shared/schema";
import { Status } from "@shared/schema";
import Header from "@/components/Header";
import ReportSummary from "@/components/ReportSummary";
import FeedbackList from "@/components/FeedbackList";
import AddFeedbackModal from "@/components/AddFeedbackModal";
import EditFeedbackModal from "@/components/EditFeedbackModal";
import ReportModal from "@/components/ReportModal";
import Toast from "@/components/Toast";
import AdminAuthModal from "@/components/AdminAuthModal";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAdminMode, setAdminMode] = useState(false);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);

  const { data: feedbackItems = [], isLoading } = useQuery<Feedback[]>({
    queryKey: ["/api/feedbacks"],
  });

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

  const handleAdminLogout = () => {
    setAdminMode(false);
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
        onAdminLoginClick={() => setAuthModalOpen(true)}
        onAdminLogout={handleAdminLogout}
        isAdminMode={isAdminMode}
      />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 w-full flex-grow">
        <ReportSummary feedbackItems={feedbackItems} />
        <FeedbackList
          feedbackItems={feedbackItems}
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
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setReportModalOpen(false)}
          feedbackItems={feedbackItems}
        />
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
