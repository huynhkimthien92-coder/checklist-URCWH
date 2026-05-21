export interface Issue {
  id: string;
  title?: string;
  description?: string

  // Quan trọng: cho phép undefined để tránh lỗi của bạn
  status: 'open' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  due_date?: string
  assigned_to?: string
  
  created_at?: string;
  closed_at?: string;

  updated_at?: string;

  assignee?: string;
  reporter?: string;

  // Cho chart/recharts dễ dùng
  value?: number;
  area?: string

  x_percent?: number
  y_percent?: number

  image_before?: string;
  image_after?: string;


}
