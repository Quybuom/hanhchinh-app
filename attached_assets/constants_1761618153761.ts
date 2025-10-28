import { Feedback, Status } from './types';

export const STATUS_OPTIONS = [
  { value: Status.Received, label: 'Mới tiếp nhận' },
  { value: Status.Processing, label: 'Đang xử lý' },
  { value: Status.Resolved, label: 'Đã xử lý' },
];

export const ASSIGNEES = [
  'Nguyễn Văn An',
  'Trần Thị Bình',
  'Lê Hoàng Cường',
  'Phạm Thị Dung',
  'Võ Minh Long',
];

export const MOCK_FEEDBACK_ITEMS: Feedback[] = [
    {
        id: '1',
        unitName: 'Phòng Kế hoạch - Tài chính',
        title: 'Vướng mắc về quy trình thanh toán tạm ứng',
        description: 'Quy trình thanh toán tạm ứng mới còn nhiều bước rườm rà, đề nghị phòng ban xem xét đơn giản hóa để đẩy nhanh tiến độ công việc cho các đơn vị khác. Cụ thể, bước xác nhận của trưởng phòng thường mất nhiều thời gian.',
        submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: Status.Processing,
        assignee: 'Trần Thị Bình',
    },
    {
        id: '2',
        unitName: 'Phòng Tổ chức - Cán bộ',
        title: 'Đề xuất tổ chức tập huấn kỹ năng mềm',
        description: 'Nhân sự mới còn yếu về kỹ năng giao tiếp và làm việc nhóm. Đề nghị phòng Tổ chức - Cán bộ xem xét tổ chức các buổi tập huấn chuyên đề để nâng cao chất lượng nhân sự.',
        submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: Status.Received,
        assignee: null,
    },
    {
        id: '3',
        unitName: 'Trung tâm Công nghệ thông tin',
        title: 'Lỗi không thể truy cập hệ thống email nội bộ',
        description: 'Từ sáng nay, nhiều nhân viên không thể đăng nhập vào hệ thống email nội bộ. Mong trung tâm kiểm tra và khắc phục sớm. Lỗi báo "Sai thông tin xác thực" dù đã nhập đúng mật khẩu.',
        imageUrl: 'https://via.placeholder.com/400x300.png?text=Screenshot+Lỗi+Email',
        submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: Status.Resolved,
        assignee: 'Nguyễn Văn An',
    },
     {
        id: '4',
        unitName: 'Văn phòng Đảng ủy',
        title: 'Góp ý về công tác chuẩn bị Đại hội',
        description: 'Phần trang trí khánh tiết cần bổ sung thêm cây xanh để không gian trang trọng hơn. Ngoài ra, tài liệu phát cho đại biểu cần được đóng quyển cẩn thận hơn.',
        submittedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        status: Status.Resolved,
        assignee: 'Lê Hoàng Cường',
    },
    {
        id: '5',
        unitName: 'Phòng Kế hoạch - Tài chính',
        title: 'Sai sót trong bảng lương tháng vừa rồi',
        description: 'Bảng lương tháng vừa rồi của phòng có sai sót ở mục phụ cấp. Đề nghị kiểm tra và điều chỉnh lại.',
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: Status.Received,
        assignee: null,
    },
];
