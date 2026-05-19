'use client'
// app/robot-checklist/[id]/RobotChecklistClient.tsx

import { useEffect, useRef, useState } from 'react'
import { RobotChecklistForm } from '@/components/forms/RobotChecklistForm'
import { RobotChecklist } from '@/lib/robot-checklist-data'

interface Props {
  checklist: RobotChecklist
}

export default function RobotChecklistClient({ checklist: initial }: Props) {
  const [checklist, setChecklist] = useState<RobotChecklist>(initial)
  const lastUpdatedAt = useRef(initial.updated_at)

  // Chỉ sync khi server thực sự trả về data mới hơn (updated_at thay đổi)
  // Tránh việc object reference mới mỗi render làm trigger không cần thiết
  useEffect(() => {
    if (initial.updated_at !== lastUpdatedAt.current) {
      lastUpdatedAt.current = initial.updated_at
      setChecklist(initial)
    }
  }, [initial])

  return (
    <RobotChecklistForm
      checklist={checklist}
      onUpdate={setChecklist}
      readOnly={checklist.status === 'approved'}
    />
  )
}
