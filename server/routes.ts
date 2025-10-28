import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFeedbackSchema, submitReviewSchema, Status } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { generateTelegramNotification } from "./services/gemini";
import { sendTelegramNotification, sendStatusUpdateNotification, sendAssigneeNotification } from "./services/telegram";
import { verifyAdminPassword } from "./services/auth";
import { upload, getFileUrl } from "./upload";
import { generateCSV, generateStatisticsReport } from "./services/export";
import path from "path";
import multer from "multer";

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files using express.static for security
  const uploadsDir = path.join(process.cwd(), "uploads");
  app.use("/uploads", (req, res, next) => {
    // Prevent path traversal attacks by validating the requested path
    // Remove leading slashes and normalize to prevent directory traversal
    const requestedPath = path.normalize(req.path).replace(/^\/+/, '').replace(/^(\.\.[\/\\])+/, '');
    const safePath = path.join(uploadsDir, requestedPath);
    
    // Ensure the resolved path is still within the uploads directory
    if (!safePath.startsWith(uploadsDir)) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    res.sendFile(safePath, (err) => {
      if (err) {
        res.status(404).json({ error: "File not found" });
      }
    });
  });

  // File upload endpoint
  app.post("/api/upload", (req, res) => {
    upload.single("image")(req, res, (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ error: "Kích thước file không được vượt quá 5MB" });
          }
          return res.status(400).json({ error: "Lỗi khi tải file lên" });
        }
        // File filter error (invalid file type)
        return res.status(400).json({ error: err.message || "Chỉ chấp nhận file ảnh" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Không có file nào được tải lên" });
      }

      const fileUrl = getFileUrl(req.file.filename);
      res.json({ url: fileUrl });
    });
  });

  // Admin authentication
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!password || typeof password !== 'string') {
        console.log("Login failed: Password not provided or invalid type");
        return res.status(400).json({ error: "Password is required" });
      }

      // Trim whitespace from password
      const trimmedPassword = password.trim();
      const isValid = verifyAdminPassword(trimmedPassword);
      
      if (isValid) {
        console.log("Admin login successful");
        res.json({ success: true });
      } else {
        console.log("Login failed: Invalid password");
        res.status(401).json({ error: "Invalid password" });
      }
    } catch (error) {
      console.error("Error during admin login:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  // Get all feedbacks
  app.get("/api/feedbacks", async (_req, res) => {
    try {
      const feedbacks = await storage.getAllFeedbacks();
      res.json(feedbacks);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
      res.status(500).json({ error: "Failed to fetch feedbacks" });
    }
  });

  // Get single feedback
  app.get("/api/feedbacks/:id", async (req, res) => {
    try {
      const feedback = await storage.getFeedback(req.params.id);
      if (!feedback) {
        return res.status(404).json({ error: "Feedback not found" });
      }
      res.json(feedback);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ error: "Failed to fetch feedback" });
    }
  });

  // Create new feedback
  app.post("/api/feedbacks", async (req, res) => {
    try {
      const validationResult = insertFeedbackSchema.safeParse(req.body);
      if (!validationResult.success) {
        const error = fromZodError(validationResult.error);
        return res.status(400).json({ error: error.message });
      }

      const feedback = await storage.createFeedback(validationResult.data);
      
      // Generate AI notification asynchronously
      let message = "Phản ánh đã được gửi thành công";
      try {
        message = await generateTelegramNotification(feedback);
      } catch (error) {
        console.error("Error generating notification:", error);
      }

      // Send Telegram notification (non-blocking) - always send even if Gemini fails
      sendTelegramNotification(message, {
        trackingNumber: feedback.trackingNumber,
        unitName: feedback.unitName,
        title: feedback.title,
        description: feedback.description,
      }).catch(err => console.error("Telegram notification failed:", err));

      res.status(201).json({ feedback, message });
    } catch (error) {
      console.error("Error creating feedback:", error);
      res.status(500).json({ error: "Failed to create feedback" });
    }
  });

  // Update feedback status
  app.patch("/api/feedbacks/:id/status", async (req, res) => {
    try {
      const statusSchema = z.object({
        status: z.enum([Status.Received, Status.Processing, Status.Resolved]),
      });

      const validationResult = statusSchema.safeParse(req.body);
      if (!validationResult.success) {
        const error = fromZodError(validationResult.error);
        return res.status(400).json({ error: error.message });
      }

      const feedback = await storage.updateFeedbackStatus(
        req.params.id,
        validationResult.data.status
      );

      if (!feedback) {
        return res.status(404).json({ error: "Feedback not found" });
      }

      // Send Telegram notification for status update (non-blocking)
      sendStatusUpdateNotification(
        feedback.trackingNumber,
        feedback.title,
        feedback.unitName,
        feedback.status
      ).catch(err => console.error("Telegram status notification failed:", err));

      res.json(feedback);
    } catch (error) {
      console.error("Error updating feedback status:", error);
      res.status(500).json({ error: "Failed to update feedback status" });
    }
  });

  // Assign feedback
  app.patch("/api/feedbacks/:id/assign", async (req, res) => {
    try {
      const assignSchema = z.object({
        assignee: z.string().nullable(),
      });

      const validationResult = assignSchema.safeParse(req.body);
      if (!validationResult.success) {
        const error = fromZodError(validationResult.error);
        return res.status(400).json({ error: error.message });
      }

      const feedback = await storage.assignFeedback(
        req.params.id,
        validationResult.data.assignee
      );

      if (!feedback) {
        return res.status(404).json({ error: "Feedback not found" });
      }

      // Send Telegram notification for assignee assignment (non-blocking)
      if (feedback.assignee) {
        sendAssigneeNotification(
          feedback.trackingNumber,
          feedback.assignee
        ).catch(err => console.error("Telegram assignee notification failed:", err));
      }

      res.json(feedback);
    } catch (error) {
      console.error("Error assigning feedback:", error);
      res.status(500).json({ error: "Failed to assign feedback" });
    }
  });

  // Update feedback
  app.patch("/api/feedbacks/:id", async (req, res) => {
    try {
      const updateSchema = insertFeedbackSchema.partial();
      const validationResult = updateSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const error = fromZodError(validationResult.error);
        return res.status(400).json({ error: error.message });
      }

      const feedback = await storage.updateFeedback(
        req.params.id,
        validationResult.data
      );

      if (!feedback) {
        return res.status(404).json({ error: "Feedback not found" });
      }

      res.json(feedback);
    } catch (error) {
      console.error("Error updating feedback:", error);
      res.status(500).json({ error: "Failed to update feedback" });
    }
  });

  // Delete feedback
  app.delete("/api/feedbacks/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteFeedback(req.params.id);

      if (!deleted) {
        return res.status(404).json({ error: "Feedback not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting feedback:", error);
      res.status(500).json({ error: "Failed to delete feedback" });
    }
  });

  // Submit review for feedback
  app.post("/api/feedbacks/:id/review", async (req, res) => {
    try {
      const validationResult = submitReviewSchema.safeParse(req.body);
      if (!validationResult.success) {
        const error = fromZodError(validationResult.error);
        return res.status(400).json({ error: error.message });
      }

      const { rating, reviewComment, contactPhone } = validationResult.data;
      
      const feedback = await storage.submitReview(
        req.params.id,
        rating,
        reviewComment,
        contactPhone
      );

      if (!feedback) {
        return res.status(404).json({ error: "Feedback not found" });
      }

      res.json(feedback);
    } catch (error: any) {
      console.error("Error submitting review:", error);
      if (error.message === "Contact phone does not match") {
        return res.status(403).json({ error: "Số điện thoại không khớp với người gửi" });
      }
      if (error.message === "Can only review resolved feedback") {
        return res.status(400).json({ error: "Chỉ có thể đánh giá kiến nghị đã xử lý" });
      }
      if (error.message === "Feedback already reviewed") {
        return res.status(400).json({ error: "Kiến nghị này đã được đánh giá" });
      }
      res.status(500).json({ error: "Failed to submit review" });
    }
  });

  // Mark feedback as resolved (with password verification)
  app.post("/api/feedbacks/:id/mark-resolved", async (req, res) => {
    try {
      const { password } = req.body;

      if (!password || typeof password !== 'string') {
        return res.status(400).json({ error: "Vui lòng nhập mật khẩu" });
      }

      // Verify password
      const trimmedPassword = password.trim();
      const isValid = verifyAdminPassword(trimmedPassword);

      if (!isValid) {
        return res.status(401).json({ error: "Mật khẩu không đúng" });
      }

      // Get current feedback to check status
      const currentFeedback = await storage.getFeedback(req.params.id);
      if (!currentFeedback) {
        return res.status(404).json({ error: "Không tìm thấy kiến nghị" });
      }

      // Only allow marking as resolved if currently processing
      if (currentFeedback.status !== Status.Processing) {
        return res.status(400).json({ error: "Chỉ có thể đánh dấu 'Đã giải quyết' cho kiến nghị đang xử lý" });
      }

      // Update status to resolved
      const success = await storage.updateFeedbackStatus(req.params.id, Status.Resolved);

      if (!success) {
        return res.status(404).json({ error: "Không tìm thấy kiến nghị" });
      }

      // Get updated feedback for notification
      const feedback = await storage.getFeedback(req.params.id);
      if (feedback) {
        // Send Telegram notification about status change (non-blocking)
        sendStatusUpdateNotification(
          feedback.trackingNumber,
          feedback.title,
          feedback.unitName,
          Status.Resolved
        ).catch(err => {
          console.error("Failed to send Telegram notification, but status was updated:", err);
        });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error marking feedback as resolved:", error);
      res.status(500).json({ error: "Không thể cập nhật trạng thái" });
    }
  });

  // Export feedbacks as CSV
  app.get("/api/export/csv", async (_req, res) => {
    try {
      const feedbacks = await storage.getAllFeedbacks();
      const csv = generateCSV(feedbacks);
      
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="phan-anh-${new Date().toISOString().split('T')[0]}.csv"`);
      
      // Add BOM for Excel to recognize UTF-8
      res.send("\uFEFF" + csv);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      res.status(500).json({ error: "Lỗi khi xuất file CSV" });
    }
  });

  // Export statistics report as text
  app.get("/api/export/report", async (_req, res) => {
    try {
      const feedbacks = await storage.getAllFeedbacks();
      const report = generateStatisticsReport(feedbacks);
      
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="bao-cao-${new Date().toISOString().split('T')[0]}.txt"`);
      
      res.send(report);
    } catch (error) {
      console.error("Error exporting report:", error);
      res.status(500).json({ error: "Lỗi khi xuất báo cáo" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
