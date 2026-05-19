// app/robot-checklist/page.tsx

import { Navbar } from '@/components/layout/Navbar'
import RobotChecklistListClient from './RobotChecklistListClient'

// ✅ không cache vì data realtime
export const dynamic = 'force-dynamic'

export default function RobotChecklistPage() {
  return (
    <div className="min-h-screen bg-slate-50">

      {/* NAVBAR */}
      <Navbar />

      {/* MAIN CONTENT */}
      <main className="max-w-5xl mx-auto px-4 py-6">

        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">
            🤖 Robot Checklist
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý checklist kiểm tra robot theo tháng
          </p>
        </div>

        {/* LIST CLIENT */}
        <RobotChecklistListClient />

      </main>
    </div>
  )
}
