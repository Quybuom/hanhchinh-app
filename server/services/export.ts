import type { Feedback } from "@shared/schema";

export function generateCSV(feedbacks: Feedback[]): string {
  // CSV Headers
  const headers = [
    "ID",
    "Đơn vị",
    "Tiêu đề",
    "Mô tả",
    "Trạng thái",
    "Người xử lý",
    "Ngày gửi",
    "Hình ảnh"
  ];

  // Status mapping
  const statusMap: Record<string, string> = {
    received: "Mới tiếp nhận",
    processing: "Đang xử lý",
    resolved: "Đã xử lý",
  };

  // Convert feedback data to CSV rows
  const rows = feedbacks.map(feedback => [
    escapeCSV(feedback.id),
    escapeCSV(feedback.unitName),
    escapeCSV(feedback.title),
    escapeCSV(feedback.description),
    escapeCSV(statusMap[feedback.status] || feedback.status),
    escapeCSV(feedback.assignee || "Chưa phân công"),
    escapeCSV(new Date(feedback.submittedAt).toISOString().replace('T', ' ').split('.')[0]),
    escapeCSV(feedback.imageUrl || "Không có")
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.join(","))
  ].join("\n");

  return csvContent;
}

function escapeCSV(value: string): string {
  // Escape double quotes and wrap in quotes if contains comma, newline, or quote
  const escaped = value.replace(/"/g, '""');
  if (escaped.includes(",") || escaped.includes("\n") || escaped.includes('"')) {
    return `"${escaped}"`;
  }
  return escaped;
}

export function generateStatisticsReport(feedbacks: Feedback[]): string {
  const total = feedbacks.length;
  const received = feedbacks.filter(f => f.status === "received").length;
  const processing = feedbacks.filter(f => f.status === "processing").length;
  const resolved = feedbacks.filter(f => f.status === "resolved").length;
  const resolutionRate = total > 0 ? ((resolved / total) * 100).toFixed(1) : "0";

  // Count by unit
  const byUnit: Record<string, number> = {};
  feedbacks.forEach(f => {
    byUnit[f.unitName] = (byUnit[f.unitName] || 0) + 1;
  });

  // Count by assignee
  const byAssignee: Record<string, number> = {};
  feedbacks.forEach(f => {
    const assignee = f.assignee || "Chưa phân công";
    byAssignee[assignee] = (byAssignee[assignee] || 0) + 1;
  });

  const report = `
BÁO CÁO THỐNG KÊ PHẢN ÁNH
=========================

Ngày xuất báo cáo: ${new Date().toLocaleString("vi-VN")}

TỔNG QUAN
---------
Tổng số phản ánh: ${total}
Mới tiếp nhận: ${received}
Đang xử lý: ${processing}
Đã xử lý: ${resolved}
Tỷ lệ xử lý: ${resolutionRate}%

PHÂN LOẠI THEO ĐƠN VỊ
--------------------
${Object.entries(byUnit)
  .sort((a, b) => b[1] - a[1])
  .map(([unit, count]) => `${unit}: ${count} phản ánh`)
  .join("\n")}

PHÂN CÔNG THEO NHÂN VIÊN
------------------------
${Object.entries(byAssignee)
  .sort((a, b) => b[1] - a[1])
  .map(([assignee, count]) => `${assignee}: ${count} phản ánh`)
  .join("\n")}

================================
Hệ thống Quản lý Phản ánh
Trung tâm Phục vụ hành chính công tỉnh Bắc Ninh
`.trim();

  return report;
}
