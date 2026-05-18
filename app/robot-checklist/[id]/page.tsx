// app/robot-checklist/[id]/page.tsx
import { Navbar } from '@/components/layout/Navbar'
import { createServiceClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import RobotChecklistClient from './RobotChecklistClient'

export default async function RobotChecklistDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServiceClient()

  const { data: checklist, error } = await supabase
    .from('robot_checklists')
    .select('*')
    .eq('id', params.id)
    .maybeSingle()

  if (error) {
    console.error(error)
  }

  if (!checklist) {
    notFound()
  }

  
  // ✅ FIX PARSE JSON
  if (checklist) {
    checklist.items =
      typeof checklist.items === 'string'
        ? JSON.parse(checklist.items)
        : checklist.items || []

    checklist.day_entries =
      typeof checklist.day_entries === 'string'
        ? JSON.parse(checklist.day_entries)
        : checklist.day_entries || {}

    checklist.operator_signatures =
      typeof checklist.operator_signatures === 'string'
        ? JSON.parse(checklist.operator_signatures)
        : checklist.operator_signatures || {}

    checklist.supervisor_signatures =
      typeof checklist.supervisor_signatures === 'string'
        ? JSON.parse(checklist.supervisor_signatures)
        : checklist.supervisor_signatures || {}
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
