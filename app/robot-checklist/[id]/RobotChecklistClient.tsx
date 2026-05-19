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
  const lastUpdatedAt = useRef<string | null>(null) // ← null ban đầu, không phải initial.updated_at

  useEffect(() => {
    if (!initial) return

    // Lần đầu (lastUpdatedAt.current === null): luôn sync
    // Các lần sau: chỉ sync nếu server mới hơn
    if (
      lastUpdatedAt.current === null ||
      new Date(initial.updated_at).getTime() >
        new Date(lastUpdatedAt.current).getTime()
    ) {
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
