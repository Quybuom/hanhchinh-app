import { feedbacks, type Feedback, type InsertFeedback, Status, staff, type Staff, type InsertStaff, units, type Unit, type InsertUnit, staffUnitAssignments, type StaffUnitAssignment } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import { hashPassword, verifyPassword } from "./services/auth";

export interface IStorage {
  // Feedback operations
  getAllFeedbacks(): Promise<Feedback[]>;
  getFeedback(id: string): Promise<Feedback | undefined>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  updateFeedback(id: string, data: Partial<InsertFeedback>): Promise<Feedback | undefined>;
  updateFeedbackStatus(id: string, status: Status, resolutionComment?: string): Promise<Feedback | undefined>;
  assignFeedback(id: string, assignee: string | null, assigneePhone?: string | null): Promise<Feedback | undefined>;
  deleteFeedback(id: string): Promise<boolean>;
  submitReview(id: string, rating: number, reviewComment: string | undefined, contactPhone: string): Promise<Feedback | undefined>;
  
  // Staff operations
  listStaff(): Promise<Staff[]>;
  getStaff(id: number): Promise<Staff | undefined>;
  getStaffByUsername(username: string): Promise<Staff | undefined>;
  getStaffByAccessCode(accessCode: string): Promise<Staff | undefined>;
  getStaffFeedbacks(staffId: number): Promise<Feedback[]>;
  createStaff(staff: InsertStaff): Promise<Staff>;
  updateStaff(id: number, data: Partial<InsertStaff>): Promise<Staff | undefined>;
  deleteStaff(id: number): Promise<boolean>;
  
  // Unit operations
  listUnits(): Promise<Unit[]>;
  getUnit(id: number): Promise<Unit | undefined>;
  createUnit(unit: InsertUnit): Promise<Unit>;
  createUnits(unitNames: string[]): Promise<Unit[]>;
  updateUnit(id: number, data: Partial<InsertUnit>): Promise<Unit | undefined>;
  deleteUnit(id: number): Promise<boolean>;
  
  // Staff-Unit assignments
  assignStaffToUnit(staffId: number, unitId: number, isPrimary: boolean): Promise<StaffUnitAssignment>;
  removeStaffFromUnit(staffId: number, unitId: number): Promise<boolean>;
  getStaffUnits(staffId: number): Promise<Unit[]>;
  getUnitStaff(unitId: number): Promise<Staff[]>;
  
  // Auto-assignment helper
  findStaffByUnitName(unitName: string): Promise<Staff | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getAllFeedbacks(): Promise<Feedback[]> {
    return await db.select().from(feedbacks).orderBy(desc(feedbacks.submittedAt));
  }

  async getFeedback(id: string): Promise<Feedback | undefined> {
    const [feedback] = await db.select().from(feedbacks).where(eq(feedbacks.id, id));
    return feedback || undefined;
  }

  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const [feedback] = await db
      .insert(feedbacks)
      .values({
        ...insertFeedback,
        status: insertFeedback.status || Status.Received,
        assignee: insertFeedback.assignee || null,
        imageUrl: insertFeedback.imageUrl || null,
      })
      .returning();
    return feedback;
  }

  async updateFeedbackStatus(id: string, status: Status, resolutionComment?: string): Promise<Feedback | undefined> {
    const updateData: { status: Status; resolutionComment?: string | null } = { status };
    
    // When resolving, save the resolution comment if provided
    if (status === Status.Resolved && resolutionComment) {
      updateData.resolutionComment = resolutionComment;
    }
    // When reopening (setting to processing), clear the resolution comment
    if (status === Status.Processing) {
      updateData.resolutionComment = null;
    }
    
    const [feedback] = await db
      .update(feedbacks)
      .set(updateData)
      .where(eq(feedbacks.id, id))
      .returning();
    return feedback || undefined;
  }

  async assignFeedback(id: string, assignee: string | null, assigneePhone?: string | null): Promise<Feedback | undefined> {
    const updateData: { assignee: string | null; assigneePhone?: string | null; status?: Status } = { 
      assignee,
      assigneePhone: assigneePhone || null,
    };
    
    // Automatically change status to "processing" when assigning to someone
    if (assignee !== null) {
      updateData.status = Status.Processing;
    }
    
    const [feedback] = await db
      .update(feedbacks)
      .set(updateData)
      .where(eq(feedbacks.id, id))
      .returning();
    return feedback || undefined;
  }

  async updateFeedback(id: string, data: Partial<InsertFeedback>): Promise<Feedback | undefined> {
    const [feedback] = await db
      .update(feedbacks)
      .set(data)
      .where(eq(feedbacks.id, id))
      .returning();
    return feedback || undefined;
  }

  async deleteFeedback(id: string): Promise<boolean> {
    const result = await db
      .delete(feedbacks)
      .where(eq(feedbacks.id, id))
      .returning();
    return result.length > 0;
  }

  async submitReview(id: string, rating: number, reviewComment: string | undefined, contactPhone: string): Promise<Feedback | undefined> {
    // First, verify the contact phone matches
    const [existing] = await db.select().from(feedbacks).where(eq(feedbacks.id, id));
    
    if (!existing) {
      return undefined;
    }
    
    // Verify contact phone matches
    if (existing.contactPhone !== contactPhone) {
      throw new Error("Contact phone does not match");
    }
    
    // Verify status is resolved
    if (existing.status !== Status.Resolved) {
      throw new Error("Can only review resolved feedback");
    }
    
    // Verify rating doesn't already exist (check both null and undefined)
    if (existing.rating != null) {
      throw new Error("Feedback already reviewed");
    }
    
    // Update with review
    const [feedback] = await db
      .update(feedbacks)
      .set({ 
        rating, 
        reviewComment: reviewComment || null 
      })
      .where(eq(feedbacks.id, id))
      .returning();
    
    return feedback || undefined;
  }

  // Staff operations
  async listStaff(): Promise<Staff[]> {
    return await db.select().from(staff).orderBy(staff.name);
  }

  async getStaff(id: number): Promise<Staff | undefined> {
    const [result] = await db.select().from(staff).where(eq(staff.id, id));
    return result || undefined;
  }

  async getStaffByUsername(username: string): Promise<Staff | undefined> {
    const [result] = await db.select().from(staff).where(eq(staff.username, username));
    return result || undefined;
  }

  async getStaffByAccessCode(accessCode: string): Promise<Staff | undefined> {
    const [result] = await db.select().from(staff).where(eq(staff.accessCode, accessCode));
    return result || undefined;
  }

  async getStaffFeedbacks(staffId: number): Promise<Feedback[]> {
    // Get staff info first to get their name
    const staffMember = await this.getStaff(staffId);
    if (!staffMember) {
      return [];
    }

    // Get feedbacks assigned to this staff member
    return await db
      .select()
      .from(feedbacks)
      .where(eq(feedbacks.assignee, staffMember.name))
      .orderBy(desc(feedbacks.submittedAt));
  }

  async createStaff(insertStaff: InsertStaff): Promise<Staff> {
    // Auto-generate access code if not provided
    let accessCode = insertStaff.accessCode;
    if (!accessCode || accessCode.trim() === "") {
      // Get the highest existing ID to generate next code
      const allStaff = await db.select().from(staff).orderBy(desc(staff.id));
      const nextId = allStaff.length > 0 ? allStaff[0].id + 1 : 1;
      accessCode = `CB${String(nextId).padStart(3, '0')}`;
    }

    const [result] = await db
      .insert(staff)
      .values({
        name: insertStaff.name,
        phone: insertStaff.phone || null,
        accessCode: accessCode,
        active: insertStaff.active !== undefined ? insertStaff.active : true,
      })
      .returning();
    return result;
  }

  async updateStaff(id: number, data: Partial<InsertStaff>): Promise<Staff | undefined> {
    // Build update object
    const updateData: Partial<typeof staff.$inferInsert> = {
      name: data.name,
      phone: data.phone !== undefined ? (data.phone || null) : undefined,
      accessCode: data.accessCode !== undefined ? (data.accessCode || null) : undefined,
      active: data.active,
    };

    const [result] = await db
      .update(staff)
      .set(updateData)
      .where(eq(staff.id, id))
      .returning();
    return result || undefined;
  }

  async deleteStaff(id: number): Promise<boolean> {
    const result = await db
      .delete(staff)
      .where(eq(staff.id, id))
      .returning();
    return result.length > 0;
  }

  // Unit operations
  async listUnits(): Promise<Unit[]> {
    return await db.select().from(units).orderBy(units.name);
  }

  async getUnit(id: number): Promise<Unit | undefined> {
    const [result] = await db.select().from(units).where(eq(units.id, id));
    return result || undefined;
  }

  async createUnit(insertUnit: InsertUnit): Promise<Unit> {
    const [result] = await db
      .insert(units)
      .values({
        ...insertUnit,
        code: insertUnit.code || null,
        parentUnitId: insertUnit.parentUnitId || null,
      })
      .returning();
    return result;
  }

  async createUnits(unitNames: string[]): Promise<Unit[]> {
    // Filter out empty names and duplicates
    const cleanNames = Array.from(new Set(unitNames.filter(name => name.trim().length > 0)));
    
    if (cleanNames.length === 0) {
      return [];
    }

    // Get max code number from existing units to continue sequence
    const existingUnits = await db.select().from(units);
    let maxCodeNumber = 0;
    for (const unit of existingUnits) {
      if (unit.code) {
        const match = unit.code.match(/^DB(\d+)$/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxCodeNumber) {
            maxCodeNumber = num;
          }
        }
      }
    }

    // Create units with auto-generated codes
    const unitsToInsert = cleanNames.map((name, index) => ({
      name: name.trim(),
      code: `DB${String(maxCodeNumber + index + 1).padStart(3, '0')}`, // DB001, DB002, etc.
      parentUnitId: null,
    }));

    const results = await db
      .insert(units)
      .values(unitsToInsert)
      .returning();
    
    return results;
  }

  async updateUnit(id: number, data: Partial<InsertUnit>): Promise<Unit | undefined> {
    const [result] = await db
      .update(units)
      .set(data)
      .where(eq(units.id, id))
      .returning();
    return result || undefined;
  }

  async deleteUnit(id: number): Promise<boolean> {
    const result = await db
      .delete(units)
      .where(eq(units.id, id))
      .returning();
    return result.length > 0;
  }

  // Staff-Unit assignments
  async assignStaffToUnit(staffId: number, unitId: number, isPrimary: boolean = true): Promise<StaffUnitAssignment> {
    const [result] = await db
      .insert(staffUnitAssignments)
      .values({ staffId, unitId, isPrimary })
      .onConflictDoUpdate({
        target: [staffUnitAssignments.staffId, staffUnitAssignments.unitId],
        set: { isPrimary },
      })
      .returning();
    return result;
  }

  async removeStaffFromUnit(staffId: number, unitId: number): Promise<boolean> {
    const result = await db
      .delete(staffUnitAssignments)
      .where(
        and(
          eq(staffUnitAssignments.staffId, staffId),
          eq(staffUnitAssignments.unitId, unitId)
        )
      )
      .returning();
    return result.length > 0;
  }

  async getStaffUnits(staffId: number): Promise<Unit[]> {
    const result = await db
      .select({ unit: units })
      .from(staffUnitAssignments)
      .innerJoin(units, eq(staffUnitAssignments.unitId, units.id))
      .where(eq(staffUnitAssignments.staffId, staffId));
    return result.map(r => r.unit);
  }

  async getUnitStaff(unitId: number): Promise<Staff[]> {
    const result = await db
      .select({ staff: staff })
      .from(staffUnitAssignments)
      .innerJoin(staff, eq(staffUnitAssignments.staffId, staff.id))
      .where(eq(staffUnitAssignments.unitId, unitId));
    return result.map(r => r.staff);
  }

  // Auto-assignment helper
  async findStaffByUnitName(unitName: string): Promise<Staff | undefined> {
    // Normalize unit name for better matching
    const normalizedUnitName = unitName.trim().toLowerCase();
    
    // Find unit by name (case-insensitive)
    const [unit] = await db
      .select()
      .from(units)
      .where(eq(units.name, unitName));
    
    if (!unit) {
      return undefined;
    }
    
    // Find active staff assigned to this unit
    const result = await db
      .select({ staff: staff })
      .from(staffUnitAssignments)
      .innerJoin(staff, eq(staffUnitAssignments.staffId, staff.id))
      .where(
        and(
          eq(staffUnitAssignments.unitId, unit.id),
          eq(staff.active, true)
        )
      )
      .limit(1);
    
    return result.length > 0 ? result[0].staff : undefined;
  }
}

export const storage = new DatabaseStorage();
