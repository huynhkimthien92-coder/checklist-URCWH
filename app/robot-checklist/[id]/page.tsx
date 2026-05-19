// app/robot-checklist/[id]/page.tsx
export const dynamic = 'force-dynamic'  // ✅ Không cache — luôn fetch DB mới nhất khi mở trang
import { Navbar } from '@/components/layout/Navbar'
import { createServiceClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import RobotChecklistClient from './RobotChecklistClient'


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

  
  // ✅ FIX PARSE JSON

  const cleaned = {
    ...checklist,
    items: safeParse(checklist.items) || [],
    day_entries: safeParse(checklist.day_entries) || {},
    operator_signatures: safeParse(checklist.operator_signatures) || {},
    supervisor_signatures: safeParse(checklist.supervisor_signatures) || {},
  }

  console.log('ITEMS TYPE:', typeof checklist.items)
  console.log('ITEMS:', checklist.items)


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
          <RobotChecklistClient
            key={cleaned.updated_at}
            checklist={cleaned}
          />

        </div>
      </main>
    </div>
  )
}
