import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, serial, integer, boolean, primaryKey } from "drizzle-orm/pg-core";
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

// Staff table - Quản lý cán bộ
export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  active: boolean("active").notNull().default(true),
});

// Units table - Danh sách đơn vị/địa bàn
export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  code: text("code"),
  parentUnitId: integer("parent_unit_id"),
});

// Staff-Unit assignments - Phân công cán bộ theo địa bàn
export const staffUnitAssignments = pgTable("staff_unit_assignments", {
  staffId: integer("staff_id").notNull().references(() => staff.id, { onDelete: 'cascade' }),
  unitId: integer("unit_id").notNull().references(() => units.id, { onDelete: 'cascade' }),
  isPrimary: boolean("is_primary").notNull().default(true),
}, (table) => ({
  pk: primaryKey({ columns: [table.staffId, table.unitId] }),
}));

// Staff schemas
export const insertStaffSchema = createInsertSchema(staff).omit({
  id: true,
}).extend({
  name: z.string().min(1, "Tên cán bộ không được để trống"),
  phone: z.string().regex(/^[0-9]{10,11}$/, "Số điện thoại phải có 10-11 chữ số").optional().or(z.literal('')),
  active: z.boolean().default(true),
});

export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type Staff = typeof staff.$inferSelect;

// Units schemas
export const insertUnitSchema = createInsertSchema(units).omit({
  id: true,
}).extend({
  name: z.string().min(1, "Tên đơn vị không được để trống"),
  code: z.string().optional().or(z.literal('')),
  parentUnitId: z.number().optional().nullable(),
});

export type InsertUnit = z.infer<typeof insertUnitSchema>;
export type Unit = typeof units.$inferSelect;

// Staff-Unit assignment schemas
export const insertStaffUnitAssignmentSchema = createInsertSchema(staffUnitAssignments).extend({
  staffId: z.number(),
  unitId: z.number(),
  isPrimary: z.boolean().default(true),
});

export type InsertStaffUnitAssignment = z.infer<typeof insertStaffUnitAssignmentSchema>;
export type StaffUnitAssignment = typeof staffUnitAssignments.$inferSelect;
