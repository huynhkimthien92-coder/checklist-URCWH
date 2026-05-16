import { Navbar } from '@/components/layout/Navbar'
import { RobotChecklistForm } from '@/components/forms/RobotChecklistForm'
import { createServiceClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import RobotChecklistClient from '@/robot-checklist/RobotChecklistClient.tsx'

export default async function RobotChecklistDetailPage({ params }: any) {
  const supabase = createServiceClient()

  const { data: checklist, error } = await supabase
    .from('robot_checklists')
    .select('*')
    .eq('id', params.id)
    .maybeSingle() // ✅ tránh crash nếu không có data

  if (error) {
    console.error(error)
  }

  if (!checklist) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-5 space-y-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Robot: {checklist.robot_number}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Tháng {checklist.month}/{checklist.year} · {checklist.area}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <RobotChecklistClient checklist={checklist} />
        </div>
      </main>
    </div>
  )
}
