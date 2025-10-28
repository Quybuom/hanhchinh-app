import { type Feedback, type InsertFeedback, Status } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getAllFeedbacks(): Promise<Feedback[]>;
  getFeedback(id: string): Promise<Feedback | undefined>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  updateFeedbackStatus(id: string, status: Status): Promise<Feedback | undefined>;
  assignFeedback(id: string, assignee: string | null): Promise<Feedback | undefined>;
}

export class MemStorage implements IStorage {
  private feedbacks: Map<string, Feedback>;

  constructor() {
    this.feedbacks = new Map();
  }

  async getAllFeedbacks(): Promise<Feedback[]> {
    const feedbacks = Array.from(this.feedbacks.values());
    return feedbacks.sort((a, b) => 
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }

  async getFeedback(id: string): Promise<Feedback | undefined> {
    return this.feedbacks.get(id);
  }

  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const id = randomUUID();
    const feedback: Feedback = {
      ...insertFeedback,
      id,
      submittedAt: new Date(),
      status: insertFeedback.status || Status.Received,
      assignee: insertFeedback.assignee || null,
      imageUrl: insertFeedback.imageUrl || null,
    };
    this.feedbacks.set(id, feedback);
    return feedback;
  }

  async updateFeedbackStatus(id: string, status: Status): Promise<Feedback | undefined> {
    const feedback = this.feedbacks.get(id);
    if (!feedback) return undefined;

    const updated = { ...feedback, status };
    this.feedbacks.set(id, updated);
    return updated;
  }

  async assignFeedback(id: string, assignee: string | null): Promise<Feedback | undefined> {
    const feedback = this.feedbacks.get(id);
    if (!feedback) return undefined;

    const updated = { ...feedback, assignee };
    this.feedbacks.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
