export interface Issue {
  id: number;
  title?: string;

  // Quan trọng: cho phép undefined để tránh lỗi của bạn
  created_at?: string;

  updated_at?: string;

  status?: string;
  priority?: string;

  assignee?: string;
  reporter?: string;

  // Cho chart/recharts dễ dùng
  value?: number;
}
