'use client'
// app/robot-checklist/[id]/RobotChecklistClient.tsx

import { useState } from 'react'
import { RobotChecklistForm } from '@/components/forms/RobotChecklistForm'
import { RobotChecklist } from '@/lib/robot-checklist-data'

interface Props {
  checklist: RobotChecklist
}

export default function RobotChecklistClient({ checklist: initial }: Props) {
  // Form tự gọi onUpdate(fresh) sau mỗi lần save với data mới nhất từ DB
  // Không cần useEffect hay router.refresh() nữa
  const [checklist, setChecklist] = useState<RobotChecklist>(initial)

  return (
    <RobotChecklistForm
      checklist={checklist}
      onUpdate={setChecklist}
      readOnly={checklist.status === 'approved'}
    />
  )
}
