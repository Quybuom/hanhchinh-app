import { feedbacks, type Feedback, type InsertFeedback, Status } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getAllFeedbacks(): Promise<Feedback[]>;
  getFeedback(id: string): Promise<Feedback | undefined>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  updateFeedback(id: string, data: Partial<InsertFeedback>): Promise<Feedback | undefined>;
  updateFeedbackStatus(id: string, status: Status): Promise<Feedback | undefined>;
  assignFeedback(id: string, assignee: string | null): Promise<Feedback | undefined>;
  deleteFeedback(id: string): Promise<boolean>;
  submitReview(id: string, rating: number, reviewComment: string | undefined, contactPhone: string): Promise<Feedback | undefined>;
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

  async updateFeedbackStatus(id: string, status: Status): Promise<Feedback | undefined> {
    const [feedback] = await db
      .update(feedbacks)
      .set({ status })
      .where(eq(feedbacks.id, id))
      .returning();
    return feedback || undefined;
  }

  async assignFeedback(id: string, assignee: string | null): Promise<Feedback | undefined> {
    const updateData: { assignee: string | null; status?: Status } = { assignee };
    
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
}

export const storage = new DatabaseStorage();
