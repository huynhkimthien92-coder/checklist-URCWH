import { RobotChecklistForm } from '@/components/forms/RobotChecklistForm'

async function getChecklist(id: string) {
  try {
    const res = await fetch(`/api/robot-checklist/${id}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  }catch (e) {
    console.error(e)
    return null
  }
}


export default async function RobotChecklistDetailPage({ params }: any) {
  const checklist = await getChecklist(params.id)

  if (!checklist) {
    return <div className="p-6">Không tìm thấy checklist</div>
  }

  return (
    
      {/* Header giống forklift */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          Robot: {checklist.robot_number}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Tháng {checklist.month}/{checklist.year} · {checklist.area}
        </p>
      </div>

      {/* Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <RobotChecklistForm
          checklist={checklist}
          onUpdate={() => {}}
          readOnly={checklist.status === 'approved'}
        />
      </div>

  )
}
