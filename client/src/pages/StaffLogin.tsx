import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogIn } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function StaffLogin() {
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiRequest("POST", "/api/staff/login", { accessCode });
      
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
      // Extract error message from the thrown error
      const errorMessage = error.message.includes(":") 
        ? error.message.split(":").slice(1).join(":").trim()
        : error.message;
      
      toast({
        title: "Đăng nhập thất bại",
        description: errorMessage || "Vui lòng kiểm tra lại mã số",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Đăng nhập cán bộ</CardTitle>
          <CardDescription>
            Nhập mã số cán bộ để đăng nhập
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accessCode">
                Mã số cán bộ <span className="text-destructive">*</span>
              </Label>
              <Input
                id="accessCode"
                type="text"
                placeholder="Ví dụ: CB001"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                required
                disabled={loading}
                autoFocus
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
              disabled={loading}
              data-testid="button-staff-login-submit"
            >
              {loading ? (
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

            <div className="text-center text-sm text-muted-foreground">
              <Button
                type="button"
                variant="ghost"
                className="text-sm"
                onClick={() => navigate("/")}
                data-testid="button-back-to-home"
              >
                Quay lại trang chủ
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
