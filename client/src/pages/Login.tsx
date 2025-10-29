import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogIn, Shield, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const [adminPassword, setAdminPassword] = useState("");
  const [staffAccessCode, setStaffAccessCode] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);

    try {
      const response = await apiRequest("POST", "/api/admin/login", { password: adminPassword });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          toast({
            title: "Đăng nhập thành công",
            description: "Chào mừng quản trị viên!",
          });

          // Navigate to home page (admin mode will be detected)
          navigate("/");
        }
      }
    } catch (error: any) {
      const errorMessage = error.message.includes(":") 
        ? error.message.split(":").slice(1).join(":").trim()
        : error.message;
      
      toast({
        title: "Đăng nhập thất bại",
        description: errorMessage || "Vui lòng kiểm tra lại mật khẩu",
        variant: "destructive",
      });
    } finally {
      setAdminLoading(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffLoading(true);

    try {
      const response = await apiRequest("POST", "/api/staff/login", { accessCode: staffAccessCode });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.staff) {
          // Store staff info in localStorage
          localStorage.setItem("staff", JSON.stringify(data.staff));
          
          toast({
            title: "Đăng nhập thành công",
            description: `Xin chào ${data.staff.name}!`,
          });

          // Navigate to staff dashboard
          navigate("/staff/dashboard");
        }
      }
    } catch (error: any) {
      const errorMessage = error.message.includes(":") 
        ? error.message.split(":").slice(1).join(":").trim()
        : error.message;
      
      toast({
        title: "Đăng nhập thất bại",
        description: errorMessage || "Vui lòng kiểm tra lại mã số",
        variant: "destructive",
      });
    } finally {
      setStaffLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Đăng nhập hệ thống</CardTitle>
          <CardDescription>
            Hệ thống hỗ trợ giải quyết thủ tục hành chính tỉnh Bắc Ninh
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="admin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="admin" data-testid="tab-admin-login">
                <Shield className="w-4 h-4 mr-2" />
                Quản trị viên
              </TabsTrigger>
              <TabsTrigger value="staff" data-testid="tab-staff-login">
                <User className="w-4 h-4 mr-2" />
                Cán bộ xử lý
              </TabsTrigger>
            </TabsList>

            {/* Admin Login Tab */}
            <TabsContent value="admin" className="space-y-4 mt-4">
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-password">
                    Mật khẩu quản trị <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="Nhập mật khẩu"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    disabled={adminLoading}
                    autoFocus
                    data-testid="input-admin-password"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={adminLoading}
                  data-testid="button-admin-submit"
                >
                  {adminLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang đăng nhập...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Đăng nhập
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Staff Login Tab */}
            <TabsContent value="staff" className="space-y-4 mt-4">
              <form onSubmit={handleStaffLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="staff-access-code">
                    Mã số cán bộ <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="staff-access-code"
                    type="text"
                    placeholder="Ví dụ: CB001"
                    value={staffAccessCode}
                    onChange={(e) => setStaffAccessCode(e.target.value.toUpperCase())}
                    required
                    disabled={staffLoading}
                    data-testid="input-staff-access-code"
                    className="text-center text-lg font-mono"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Liên hệ admin để lấy mã số nếu chưa có
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={staffLoading}
                  data-testid="button-staff-submit"
                >
                  {staffLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang đăng nhập...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Đăng nhập
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
