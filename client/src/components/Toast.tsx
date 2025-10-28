import { useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5" data-testid="toast">
      <Card className="shadow-xl max-w-md">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-chart-2/10 flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-chart-2" />
            </div>
            <p className="text-sm text-foreground flex-1 pt-1" data-testid="toast-message">
              {message}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 flex-shrink-0"
              onClick={onClose}
              data-testid="button-close-toast"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
