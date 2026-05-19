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

  // Khi server re-fetch và truyền prop mới xuống (sau router.refresh()),
  // cập nhật state để component luôn dùng data mới nhất từ DB
  useEffect(() => {
    setChecklist(initial)
  }, [initial])

  return (
    <RobotChecklistForm
      checklist={checklist}
      onUpdate={setChecklist}
      readOnly={checklist.status === 'approved'}
    />
  )
}
