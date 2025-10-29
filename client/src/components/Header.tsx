import { Button } from "@/components/ui/button";
import { ClipboardList, FileText, LogIn, LogOut, Users } from "lucide-react";

interface HeaderProps {
  onAddFeedback: () => void;
  onShowReport: () => void;
  onAdminLoginClick: () => void;
  onAdminLogout: () => void;
  onShowStaffManagement?: () => void;
  isAdminMode: boolean;
}

export default function Header({
  onAddFeedback,
  onShowReport,
  onAdminLoginClick,
  onAdminLogout,
  onShowStaffManagement,
  isAdminMode,
}: HeaderProps) {
  return (
    <header className="bg-card border-b border-card-border shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
              <ClipboardList className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-semibold text-foreground leading-tight">
                HỖ TRỢ NGƯỜI DÙNG HỆ THỐNG
              </h1>
              <p className="text-xs text-muted-foreground">
                GIẢI QUYẾT THỦ TỤC HÀNH CHÍNH TỈNH BẮC NINH
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={onAddFeedback}
              size="default"
              className="gap-2"
              data-testid="button-add-feedback"
            >
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">GỬI YÊU CẦU HỖ TRỢ</span>
              <span className="sm:hidden">Gửi</span>
            </Button>

            {isAdminMode && (
              <>
                <Button
                  onClick={onShowReport}
                  variant="outline"
                  size="default"
                  className="gap-2"
                  data-testid="button-show-report"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Báo cáo</span>
                </Button>
                <Button
                  onClick={onShowStaffManagement}
                  variant="outline"
                  size="default"
                  className="gap-2"
                  data-testid="button-staff-management"
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Quản lý cán bộ</span>
                </Button>
              </>
            )}

            {isAdminMode ? (
              <Button
                onClick={onAdminLogout}
                variant="ghost"
                size="icon"
                data-testid="button-admin-logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={onAdminLoginClick}
                variant="ghost"
                size="icon"
                data-testid="button-admin-login"
              >
                <LogIn className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
