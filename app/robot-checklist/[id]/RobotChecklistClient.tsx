'use client'
// app/robot-checklist/[id]/RobotChecklistClient.tsx

import { useEffect, useState } from 'react'
import { RobotChecklistForm } from '@/components/forms/RobotChecklistForm'
import { RobotChecklist } from '@/lib/robot-checklist-data'

interface Props {
  checklist: RobotChecklist
}

export default function RobotChecklistClient({ checklist: initial }: Props) {
  const [checklist, setChecklist] = useState<RobotChecklist>(initial)

  // ✅ Khi server component re-render (sau router.refresh()),
  // Next.js truyền props mới xuống — sync vào state
  // So sánh bằng updated_at (string primitive) để tránh so sánh object reference
  useEffect(() => {
    if (initial.updated_at !== checklist.updated_at) {
      setChecklist(initial)
    }
  }, [initial.updated_at])

  return (
    <RobotChecklistForm
      checklist={checklist}
      onUpdate={setChecklist}
      readOnly={checklist.status === 'approved'}
    />
  )
}
