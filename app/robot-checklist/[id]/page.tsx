// app/robot-checklist/[id]/page.tsx

export const dynamic = 'force-dynamic'

import { Navbar } from '@/components/layout/Navbar'
import { createServiceClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { RobotChecklistForm } from '@/components/forms/RobotChecklistForm'

// ✅ helper parse JSON
function safeParse(value: any) {
  if (!value) return value
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }
  return value
}

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

  // ✅ parse JSON giống trước
  const cleaned = {
    ...checklist,
    items: safeParse(checklist.items) || [],
    day_entries: safeParse(checklist.day_entries) || {},
    operator_signatures: safeParse(checklist.operator_signatures) || {},
    supervisor_signatures: safeParse(checklist.supervisor_signatures) || {},
    incidents: safeParse(checklist.incidents) || [],
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-5 space-y-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Robot: {cleaned.robot_number}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Tháng {cleaned.month}/{cleaned.year} · {cleaned.area}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">

          {/* ✅ GỌI TRỰC TIẾP FORM — KHÔNG QUA CLIENT WRAPPER */}
          <RobotChecklistForm
            checklist={cleaned}
            readOnly={cleaned.status === 'approved'}
          />

        </div>
      </main>
    </div>
  )
}
