import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Feedback, InsertFeedback } from "@shared/schema";
import { Status } from "@shared/schema";
import Header from "@/components/Header";
import ReportSummary from "@/components/ReportSummary";
import FeedbackList from "@/components/FeedbackList";
import AddFeedbackModal from "@/components/AddFeedbackModal";
import ReportModal from "@/components/ReportModal";
import Toast from "@/components/Toast";
import AdminAuthModal from "@/components/AdminAuthModal";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAdminMode, setAdminMode] = useState(false);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);

  const { data: feedbackItems = [], isLoading } = useQuery<Feedback[]>({
    queryKey: ["/api/feedbacks"],
  });

  const addFeedbackMutation = useMutation({
    mutationFn: async (data: Omit<InsertFeedback, 'status' | 'assignee'>) => {
      return await apiRequest("POST", "/api/feedbacks", data);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/feedbacks"] });
      if (data && typeof data === 'object' && 'message' in data) {
        setToastMessage(data.message);
      } else {
        setToastMessage("Phản ánh đã được gửi thành công");
      }
    },
    onError: () => {
      setToastMessage("Lỗi khi gửi phản ánh");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      return await apiRequest("PATCH", `/api/feedbacks/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feedbacks"] });
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ id, assignee }: { id: string; assignee: string | null }) => {
      return await apiRequest("PATCH", `/api/feedbacks/${id}/assign`, { assignee });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feedbacks"] });
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

  const handleAuthenticate = async (password: string): Promise<boolean> => {
    try {
      const response = await apiRequest("POST", "/api/admin/login", { password });
      if (response && typeof response === 'object' && 'success' in response) {
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
