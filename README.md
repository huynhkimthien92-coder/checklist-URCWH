# 🏭 Forklift Safety Checklist — WH-SOP01-FR01

Hệ thống kiểm tra an toàn xe nâng hàng ngày. Xây dựng với Next.js 14, Supabase, deploy trên Vercel.

---

## 🚀 Hướng dẫn Deploy lên Vercel

### Bước 1: Chuẩn bị Supabase

1. Vào [supabase.com](https://supabase.com) → tạo project mới
2. Vào **SQL Editor** → chạy toàn bộ nội dung file `supabase-schema.sql`
3. Vào **Storage** → tạo bucket tên `checklist-images` (Private)
4. Lấy các keys từ **Settings → API**:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `anon` / `public` key  
   - `SUPABASE_SERVICE_ROLE_KEY` = `service_role` key (**SECRET - đừng commit**)

### Bước 2: Tạo admin user đầu tiên

Chạy lệnh sau để tạo hash password:
```bash
node -e "const b=require('bcryptjs');console.log(b.hashSync('Admin@2025',10))"
```

Chèn vào Supabase SQL Editor:
```sql
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Admin', 'admin@company.com', '<hash_từ_lệnh_trên>', 'admin');
```

### Bước 3: Deploy lên Vercel

1. Push code lên GitHub
2. Vào [vercel.com](https://vercel.com) → Import Repository
3. Thêm **Environment Variables** (Settings → Environment Variables):

| Variable | Giá trị |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL từ Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key từ Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key (**KHÔNG phải anon key**) |
| `NEXTAUTH_URL` | URL của app Vercel (vd: `https://myapp.vercel.app`) |
| `NEXTAUTH_SECRET` | Chạy `openssl rand -base64 32` để tạo |

4. Deploy → Done!

---

## ⚠️ Lỗi thường gặp

### `SUPABASE_SERVICE_ROLE_KEY` dùng sai key
- **SAI**: Dùng `anon public key` cho `SUPABASE_SERVICE_ROLE_KEY`
- **ĐÚNG**: Dùng `service_role` key (trong Supabase → Settings → API → Service role key)
- Service role key có đặc quyền bypass RLS, dùng cho server-side operations

### `NEXTAUTH_URL` không đúng
- Phải khớp với domain Vercel: `https://your-app.vercel.app`
- Không có trailing slash

### Checklist không load
- Kiểm tra Supabase SQL đã chạy đúng chưa
- Kiểm tra bucket `checklist-images` đã tạo chưa

---

## 🔑 Phân quyền

| Role | Quyền |
|------|-------|
| `admin` | Quản lý users, xem tất cả checklists, xuất báo cáo |
| `operator` | Tạo & điền checklist, ký tên, nộp báo cáo |
| `supervisor` | Xem checklist được nộp, ký xác nhận, duyệt |

## 📋 Quy trình

```
Operator tạo checklist
    → Điền kiểm tra hàng ngày (P/X + ảnh + chi tiết)
    → Ký tên từng ngày
    → Nộp báo cáo (status: submitted)
        → Supervisor xem xét
        → Supervisor ký tên từng ngày
        → Duyệt (status: approved)
            → Xuất Excel báo cáo
```

## 🛠️ Phát triển local

```bash
npm install
cp .env.local.example .env.local  # điền các keys
npm run dev
```
