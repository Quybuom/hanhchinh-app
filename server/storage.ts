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
    const [feedback] = await db
      .update(feedbacks)
      .set({ assignee })
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
}

export const storage = new DatabaseStorage();
