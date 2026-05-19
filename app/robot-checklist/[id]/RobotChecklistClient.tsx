'use client'
// app/robot-checklist/[id]/RobotChecklistClient.tsx

import { useState } from 'react'
import { RobotChecklistForm } from '@/components/forms/RobotChecklistForm'
import { RobotChecklist } from '@/lib/robot-checklist-data'

interface Props {
  checklist: RobotChecklist
}

export default function RobotChecklistClient({ checklist: initial }: Props) {
  // ✅ page.tsx đã dùng key={cleaned.updated_at} → component remount khi server refresh
  // → useState(initial) luôn nhận đúng data mới nhất từ DB khi remount
  // Không cần useEffect sync phức tạp nữa
  const [checklist, setChecklist] = useState<RobotChecklist>(initial)

  return (
    <RobotChecklistForm
      checklist={checklist}
      onUpdate={setChecklist}
      readOnly={checklist.status === 'approved'}
    />
  )
}
