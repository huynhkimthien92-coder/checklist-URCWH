import { Navbar } from '@/components/layout/Navbar'
import { createServiceClient } from '@/lib/supabase'
import Link from 'next/link'

export default async function RobotChecklistPage() {
  const supabase = createServiceClient()

  const { data: checklists, error } = await supabase
    .from('robot_checklists')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Checklist Robot
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Danh sách checklist robot
            </p>
          </div>
        </div>

        {/* List */}
        {!checklists || checklists.length === 0 ? (
          <p className="text-slate-400 italic">Chưa có checklist</p>
        ) : (
          <div className="space-y-3">
            {checklists.map((cl) => (
              <Link
                key={cl.id}
                href={`/robot-checklist/${cl.id}`}
                className="block p-4 border rounded-xl bg-white hover:shadow-sm transition"
              >
                <div className="font-medium text-slate-800">
                  {cl.robot_number}
                </div>
                <div className="text-xs text-slate-500">
                  Tháng {cl.month}/{cl.year}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {cl.status}
                </div>
              </Link>
            ))}
          </div>
        )}

      </main>
    </div>
  )
}
