import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFeedbackSchema, Status } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { generateTelegramNotification } from "./services/gemini";
import { sendTelegramNotification, sendStatusUpdateNotification } from "./services/telegram";
import { verifyAdminPassword } from "./services/auth";
import { upload, getFileUrl } from "./upload";
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
        return res.status(400).json({ error: "Password is required" });
      }

      const isValid = verifyAdminPassword(password);
      
      if (isValid) {
        res.json({ success: true });
      } else {
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

      res.json(feedback);
    } catch (error) {
      console.error("Error assigning feedback:", error);
      res.status(500).json({ error: "Failed to assign feedback" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
