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
    this.seedMockData();
  }

  private seedMockData() {
    const mockFeedbacks: Omit<Feedback, 'id'>[] = [
      {
        unitName: 'Phòng Kế hoạch - Tài chính',
        title: 'Vướng mắc về quy trình thanh toán tạm ứng',
        description: 'Quy trình thanh toán tạm ứng mới còn nhiều bước rườm rà, đề nghị phòng ban xem xét đơn giản hóa để đẩy nhanh tiến độ công việc cho các đơn vị khác. Cụ thể, bước xác nhận của trưởng phòng thường mất nhiều thời gian.',
        submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: Status.Processing,
        assignee: 'Trần Thị Bình',
        imageUrl: null,
      },
      {
        unitName: 'Phòng Tổ chức - Cán bộ',
        title: 'Đề xuất tổ chức tập huấn kỹ năng mềm',
        description: 'Nhân sự mới còn yếu về kỹ năng giao tiếp và làm việc nhóm. Đề nghị phòng Tổ chức - Cán bộ xem xét tổ chức các buổi tập huấn chuyên đề để nâng cao chất lượng nhân sự.',
        submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: Status.Received,
        assignee: null,
        imageUrl: null,
      },
      {
        unitName: 'Trung tâm Công nghệ thông tin',
        title: 'Lỗi không thể truy cập hệ thống email nội bộ',
        description: 'Từ sáng nay, nhiều nhân viên không thể đăng nhập vào hệ thống email nội bộ. Mong trung tâm kiểm tra và khắc phục sớm. Lỗi báo "Sai thông tin xác thực" dù đã nhập đúng mật khẩu.',
        imageUrl: 'https://via.placeholder.com/400x300.png?text=Screenshot+Lỗi+Email',
        submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: Status.Resolved,
        assignee: 'Nguyễn Văn An',
      },
      {
        unitName: 'Văn phòng Đảng ủy',
        title: 'Góp ý về công tác chuẩn bị Đại hội',
        description: 'Phần trang trí khánh tiết cần bổ sung thêm cây xanh để không gian trang trọng hơn. Ngoài ra, tài liệu phát cho đại biểu cần được đóng quyển cẩn thận hơn.',
        submittedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        status: Status.Resolved,
        assignee: 'Lê Hoàng Cường',
        imageUrl: null,
      },
      {
        unitName: 'Phòng Kế hoạch - Tài chính',
        title: 'Sai sót trong bảng lương tháng vừa rồi',
        description: 'Bảng lương tháng vừa rồi của phòng có sai sót ở mục phụ cấp. Đề nghị kiểm tra và điều chỉnh lại.',
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: Status.Received,
        assignee: null,
        imageUrl: null,
      },
    ];

    mockFeedbacks.forEach(feedback => {
      const id = randomUUID();
      this.feedbacks.set(id, { ...feedback, id });
    });
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
