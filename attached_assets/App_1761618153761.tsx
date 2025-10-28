import React, { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MOCK_FEEDBACK_ITEMS } from './constants';
import { Feedback, Status } from './types';
import Header from './components/Header';
import ReportSummary from './components/ReportSummary';
import FeedbackList from './components/FeedbackList';
import AddFeedbackModal from './components/AddFeedbackModal';
import ReportModal from './components/ReportModal';
import Toast from './components/Toast';
import AdminAuthModal from './components/AdminAuthModal';
import { generateTelegramNotification } from './services/geminiService';

const ADMIN_PASSWORD = 'admin123'; // Mật khẩu giả lập cho mục đích demo

function App() {
  const [feedbackItems, setFeedbackItems] = useState<Feedback[]>(MOCK_FEEDBACK_ITEMS);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAdminMode, setAdminMode] = useState(false);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);

  const handleAddFeedback = useCallback(async (newFeedbackData: Omit<Feedback, 'id' | 'submittedAt' | 'status' | 'assignee'>) => {
    const newFeedback: Feedback = {
      ...newFeedbackData,
      id: uuidv4(),
      submittedAt: new Date().toISOString(),
      status: Status.Received,
      assignee: null,
    };
    setFeedbackItems(prevItems => [newFeedback, ...prevItems]);
    
    try {
      const message = await generateTelegramNotification(newFeedback);
      setToastMessage(message);
    } catch (error)
 {
      console.error("Failed to generate Telegram notification:", error);
      setToastMessage("Lỗi khi tạo thông báo cho kiến nghị mới.");
    }
  }, []);

  const handleUpdateStatus = useCallback((id: string, status: Status) => {
    setFeedbackItems(prevItems =>
      prevItems.map(item => (item.id === id ? { ...item, status } : item))
    );
  }, []);

  const handleAssign = useCallback((id: string, assignee: string) => {
    setFeedbackItems(prevItems =>
      prevItems.map(item => (item.id === id ? { ...item, assignee: assignee || null } : item))
    );
  }, []);

  const handleAuthenticate = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      setAdminMode(true);
      setAuthModalOpen(false);
      return true;
    }
    return false;
  };

  const handleAdminLogout = () => {
    setAdminMode(false);
  };
  
  return (
    <div className="bg-gradient-to-br from-sky-50 to-blue-100 min-h-screen flex flex-col">
      <Header 
        onAddFeedback={() => setAddModalOpen(true)}
        onShowReport={() => setReportModalOpen(true)}
        onAdminLoginClick={() => setAuthModalOpen(true)}
        onAdminLogout={handleAdminLogout}
        isAdminMode={isAdminMode}
      />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 w-full flex-grow">
        <ReportSummary feedbackItems={feedbackItems} />
        <FeedbackList 
          feedbackItems={feedbackItems}
          onUpdateStatus={handleUpdateStatus}
          onAssign={handleAssign}
          isAdminMode={isAdminMode}
        />
      </main>

      <footer className="py-4 text-center text-sm text-gray-500">
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
        <Toast 
          message={toastMessage} 
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}

export default App;