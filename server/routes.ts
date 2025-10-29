import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFeedbackSchema, submitReviewSchema, Status, insertStaffSchema, insertUnitSchema, insertStaffUnitAssignmentSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { generateTelegramNotification } from "./services/gemini";
import { sendTelegramNotification, sendStatusUpdateNotification, sendAssigneeNotification } from "./services/telegram";
import { verifyAdminPassword, verifyPassword } from "./services/auth";
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
        res.status(401).json({ error: "Mật khẩu không chính xác" });
      }
    } catch (error) {
      console.error("Error during admin login:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  // Staff authentication - chỉ cần mã số
  app.post("/api/staff/login", async (req, res) => {
    try {
      const loginSchema = z.object({
        accessCode: z.string().min(1, "Vui lòng nhập mã số cán bộ"),
      });

      const validationResult = loginSchema.safeParse(req.body);
      if (!validationResult.success) {
        const error = fromZodError(validationResult.error);
        return res.status(400).json({ error: error.message });
      }

      const { accessCode } = validationResult.data;

      // Find staff by access code
      const staffMember = await storage.getStaffByAccessCode(accessCode.trim());
      if (!staffMember) {
        return res.status(401).json({ error: "Mã số không chính xác" });
      }

      // Check if staff is active
      if (!staffMember.active) {
        return res.status(403).json({ error: "Tài khoản đã bị vô hiệu hóa" });
      }

      console.log(`Staff login successful: ${staffMember.name} (${accessCode})`);
      
      // Set session for authentication
      req.session.staffId = staffMember.id;
      
      // Return staff info
      res.json({
        success: true,
        staff: {
          id: staffMember.id,
          name: staffMember.name,
          phone: staffMember.phone,
          accessCode: staffMember.accessCode,
        },
      });
    } catch (error) {
      console.error("Error during staff login:", error);
      res.status(500).json({ error: "Đăng nhập thất bại" });
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

      let feedback = await storage.createFeedback(validationResult.data);
      
      // Auto-assignment: Try to find staff responsible for this unit
      let autoAssignedStaff = null;
      try {
        const staff = await storage.findStaffByUnitName(feedback.unitName);
        if (staff) {
          // Auto-assign to the responsible staff with phone number
          const updatedFeedback = await storage.assignFeedback(feedback.id, staff.name, staff.phone);
          if (updatedFeedback) {
            feedback = updatedFeedback;
            autoAssignedStaff = staff;
            console.log(`Auto-assigned feedback #${feedback.trackingNumber} to staff: ${staff.name} (${staff.phone || 'no phone'})`);
          }
        }
      } catch (error) {
        console.error("Error during auto-assignment:", error);
        // Don't fail the entire request if auto-assignment fails
      }
      
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
        assignee: autoAssignedStaff?.name,
      }).catch(err => console.error("Telegram notification failed:", err));

      // If auto-assigned, also send assignee notification
      if (autoAssignedStaff) {
        sendAssigneeNotification(
          feedback.trackingNumber,
          autoAssignedStaff.name
        ).catch(err => console.error("Assignee notification failed:", err));
      }

      res.status(201).json({ feedback, message, autoAssigned: !!autoAssignedStaff });
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

      // Find staff phone if assignee name is provided
      let assigneePhone: string | null = null;
      if (validationResult.data.assignee) {
        try {
          const allStaff = await storage.listStaff();
          const matchedStaff = allStaff.find(s => s.name === validationResult.data.assignee);
          if (matchedStaff) {
            assigneePhone = matchedStaff.phone || null;
          }
        } catch (error) {
          console.error("Error finding staff phone:", error);
        }
      }

      const feedback = await storage.assignFeedback(
        req.params.id,
        validationResult.data.assignee,
        assigneePhone
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

  // ==================== STAFF MANAGEMENT ENDPOINTS ====================

  // Get all staff
  app.get("/api/staff", async (_req, res) => {
    try {
      const staffList = await storage.listStaff();
      res.json(staffList);
    } catch (error) {
      console.error("Error fetching staff:", error);
      res.status(500).json({ error: "Không thể tải danh sách cán bộ" });
    }
  });

  // Get feedbacks for a specific staff member (scoped endpoint for security)
  app.get("/api/staff/:id/feedbacks", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID không hợp lệ" });
      }

      // CRITICAL: Verify authentication and authorization BEFORE database query
      if (!req.session.staffId) {
        return res.status(401).json({ error: "Chưa đăng nhập" });
      }

      if (req.session.staffId !== id) {
        console.warn(`Authorization failed: staff ${req.session.staffId} attempted to access feedbacks for staff ${id}`);
        return res.status(403).json({ error: "Không có quyền truy cập phản ánh của cán bộ khác" });
      }

      // Only fetch data after authorization succeeds
      const feedbacks = await storage.getStaffFeedbacks(id);
      res.json(feedbacks);
    } catch (error) {
      console.error("Error fetching staff feedbacks:", error);
      res.status(500).json({ error: "Không thể tải danh sách phản ánh" });
    }
  });

  // Get single staff
  app.get("/api/staff/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID không hợp lệ" });
      }
      
      const staffMember = await storage.getStaff(id);
      if (!staffMember) {
        return res.status(404).json({ error: "Không tìm thấy cán bộ" });
      }
      res.json(staffMember);
    } catch (error) {
      console.error("Error fetching staff:", error);
      res.status(500).json({ error: "Không thể tải thông tin cán bộ" });
    }
  });

  // Create staff
  app.post("/api/staff", async (req, res) => {
    try {
      const validationResult = insertStaffSchema.safeParse(req.body);
      if (!validationResult.success) {
        const error = fromZodError(validationResult.error);
        return res.status(400).json({ error: error.message });
      }

      const staffMember = await storage.createStaff(validationResult.data);
      res.json(staffMember);
    } catch (error) {
      console.error("Error creating staff:", error);
      res.status(500).json({ error: "Không thể tạo cán bộ mới" });
    }
  });

  // Update staff
  app.patch("/api/staff/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID không hợp lệ" });
      }

      const validationResult = insertStaffSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        const error = fromZodError(validationResult.error);
        return res.status(400).json({ error: error.message });
      }

      const staffMember = await storage.updateStaff(id, validationResult.data);
      if (!staffMember) {
        return res.status(404).json({ error: "Không tìm thấy cán bộ" });
      }
      res.json(staffMember);
    } catch (error) {
      console.error("Error updating staff:", error);
      res.status(500).json({ error: "Không thể cập nhật cán bộ" });
    }
  });

  // Delete staff
  app.delete("/api/staff/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID không hợp lệ" });
      }

      const deleted = await storage.deleteStaff(id);
      if (!deleted) {
        return res.status(404).json({ error: "Không tìm thấy cán bộ" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting staff:", error);
      res.status(500).json({ error: "Không thể xóa cán bộ" });
    }
  });

  // Get staff's assigned units
  app.get("/api/staff/:id/units", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID không hợp lệ" });
      }

      const unitsList = await storage.getStaffUnits(id);
      res.json(unitsList);
    } catch (error) {
      console.error("Error fetching staff units:", error);
      res.status(500).json({ error: "Không thể tải danh sách địa bàn" });
    }
  });

  // ==================== UNIT MANAGEMENT ENDPOINTS ====================

  // Get all units
  app.get("/api/units", async (_req, res) => {
    try {
      const unitsList = await storage.listUnits();
      res.json(unitsList);
    } catch (error) {
      console.error("Error fetching units:", error);
      res.status(500).json({ error: "Không thể tải danh sách địa bàn" });
    }
  });

  // Get single unit
  app.get("/api/units/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID không hợp lệ" });
      }

      const unit = await storage.getUnit(id);
      if (!unit) {
        return res.status(404).json({ error: "Không tìm thấy địa bàn" });
      }
      res.json(unit);
    } catch (error) {
      console.error("Error fetching unit:", error);
      res.status(500).json({ error: "Không thể tải thông tin địa bàn" });
    }
  });

  // Create unit
  app.post("/api/units", async (req, res) => {
    try {
      const validationResult = insertUnitSchema.safeParse(req.body);
      if (!validationResult.success) {
        const error = fromZodError(validationResult.error);
        return res.status(400).json({ error: error.message });
      }

      const unit = await storage.createUnit(validationResult.data);
      res.json(unit);
    } catch (error) {
      console.error("Error creating unit:", error);
      res.status(500).json({ error: "Không thể tạo địa bàn mới" });
    }
  });

  // Bulk create units
  app.post("/api/units/bulk", async (req, res) => {
    try {
      const bulkSchema = z.object({
        unitNames: z.array(z.string()).min(1, "Cần ít nhất một tên địa bàn"),
      });

      const validationResult = bulkSchema.safeParse(req.body);
      if (!validationResult.success) {
        const error = fromZodError(validationResult.error);
        return res.status(400).json({ error: error.message });
      }

      const unitsList = await storage.createUnits(validationResult.data.unitNames);
      res.json({ 
        units: unitsList,
        count: unitsList.length,
        message: `Đã tạo ${unitsList.length} địa bàn mới`
      });
    } catch (error) {
      console.error("Error bulk creating units:", error);
      res.status(500).json({ error: "Không thể tạo địa bàn" });
    }
  });

  // Update unit
  app.patch("/api/units/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID không hợp lệ" });
      }

      const validationResult = insertUnitSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        const error = fromZodError(validationResult.error);
        return res.status(400).json({ error: error.message });
      }

      const unit = await storage.updateUnit(id, validationResult.data);
      if (!unit) {
        return res.status(404).json({ error: "Không tìm thấy địa bàn" });
      }
      res.json(unit);
    } catch (error) {
      console.error("Error updating unit:", error);
      res.status(500).json({ error: "Không thể cập nhật địa bàn" });
    }
  });

  // Delete unit
  app.delete("/api/units/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID không hợp lệ" });
      }

      const deleted = await storage.deleteUnit(id);
      if (!deleted) {
        return res.status(404).json({ error: "Không tìm thấy địa bàn" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting unit:", error);
      res.status(500).json({ error: "Không thể xóa địa bàn" });
    }
  });

  // Get unit's assigned staff
  app.get("/api/units/:id/staff", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID không hợp lệ" });
      }

      const staffList = await storage.getUnitStaff(id);
      res.json(staffList);
    } catch (error) {
      console.error("Error fetching unit staff:", error);
      res.status(500).json({ error: "Không thể tải danh sách cán bộ" });
    }
  });

  // ==================== STAFF-UNIT ASSIGNMENT ENDPOINTS ====================

  // Assign staff to unit
  app.post("/api/staff/:staffId/units/:unitId", async (req, res) => {
    try {
      const staffId = parseInt(req.params.staffId);
      const unitId = parseInt(req.params.unitId);
      
      if (isNaN(staffId) || isNaN(unitId)) {
        return res.status(400).json({ error: "ID không hợp lệ" });
      }

      const { isPrimary = true } = req.body;

      const assignment = await storage.assignStaffToUnit(staffId, unitId, isPrimary);
      res.json(assignment);
    } catch (error) {
      console.error("Error assigning staff to unit:", error);
      res.status(500).json({ error: "Không thể gán cán bộ cho địa bàn" });
    }
  });

  // Remove staff from unit
  app.delete("/api/staff/:staffId/units/:unitId", async (req, res) => {
    try {
      const staffId = parseInt(req.params.staffId);
      const unitId = parseInt(req.params.unitId);
      
      if (isNaN(staffId) || isNaN(unitId)) {
        return res.status(400).json({ error: "ID không hợp lệ" });
      }

      const removed = await storage.removeStaffFromUnit(staffId, unitId);
      if (!removed) {
        return res.status(404).json({ error: "Không tìm thấy phân công" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing staff from unit:", error);
      res.status(500).json({ error: "Không thể hủy phân công" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
