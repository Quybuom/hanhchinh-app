import { v4 as uuidv4 } from 'uuid';

export enum Status {
  Received = 'received',
  Processing = 'processing',
  Resolved = 'resolved',
}

export interface Feedback {
  id: string;
  unitName: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  submittedAt: string; // ISO string format
  status: Status;
  assignee: string | null;
}
