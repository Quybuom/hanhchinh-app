import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export enum Status {
  Received = 'received',
  Processing = 'processing',
  Resolved = 'resolved',
}

export const feedbacks = pgTable("feedbacks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trackingNumber: serial("tracking_number").notNull().unique(),
  unitName: text("unit_name").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  status: text("status").notNull().default(Status.Received),
  assignee: text("assignee"),
  rating: integer("rating"),
  reviewComment: text("review_comment"),
});

export const insertFeedbackSchema = createInsertSchema(feedbacks).omit({
  id: true,
  trackingNumber: true,
  submittedAt: true,
  rating: true,
  reviewComment: true,
}).extend({
  status: z.enum([Status.Received, Status.Processing, Status.Resolved]).default(Status.Received),
  assignee: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  contactName: z.string().min(1, "Họ tên không được để trống"),
  contactPhone: z.string().regex(/^[0-9]{10,11}$/, "Số điện thoại phải có 10-11 chữ số"),
});

export const submitReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  reviewComment: z.string().optional(),
  contactPhone: z.string().regex(/^[0-9]{10,11}$/, "Số điện thoại phải có 10-11 chữ số"),
});

export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedbacks.$inferSelect;

export const STATUS_OPTIONS = [
  { value: Status.Received, label: 'Mới tiếp nhận' },
  { value: Status.Processing, label: 'Đang xử lý' },
  { value: Status.Resolved, label: 'Đã xử lý' },
];

export const ASSIGNEES: string[] = [];
