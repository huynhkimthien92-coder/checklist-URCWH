import { RobotChecklistForm } from '@/components/forms/RobotChecklistForm'

async function getChecklist(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/robot-checklist/${id}`, {
    cache: 'no-store',
  })

  if (!res.ok) return null
  return res.json()
}

export default async function RobotChecklistDetailPage({ params }: any) {
  const checklist = await getChecklist(params.id)

  if (!checklist) {
    return <div className="p-6">Không tìm thấy checklist</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      <RobotChecklistForm checklist={checklist} onUpdate={() => {}} />
    </div>
  )
}
