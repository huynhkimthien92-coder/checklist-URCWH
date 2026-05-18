// app/robot-checklist/page.tsx
// FIX: Bỏ toàn bộ fetch Supabase trực tiếp ở Server Component.
//      Chuyển thành wrapper gọi RobotChecklistListClient — giống cấu trúc của /checklist/page.tsx.
//      Client Component tự fetch /api/robot-checklist nên có filter, tạo mới và re-fetch được.

import { Navbar } from '@/components/layout/Navbar'
import RobotChecklistListClient from './RobotChecklistListClient'

export default function RobotChecklistPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <RobotChecklistListClient />
      </main>
    </div>
  )
}
