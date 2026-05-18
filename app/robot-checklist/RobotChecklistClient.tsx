'use client'
// app/robot-checklist/[id]/RobotChecklistClient.tsx
// FIX: Dùng useState để giữ local state — onUpdate={() => {}} là bug gốc khiến
//      click check không cập nhật UI dù PATCH API thành công

import { useState } from 'react'
import { RobotChecklistForm } from '@/components/forms/RobotChecklistForm'
import { RobotChecklist } from '@/lib/robot-checklist-data'

interface Props {
  checklist: RobotChecklist
}

export default function RobotChecklistClient({ checklist: initial }: Props) {
  // ✅ Local state — cập nhật ngay khi user click check/sign
  const [checklist, setChecklist] = useState<RobotChecklist>(initial)

  return (
    <RobotChecklistForm
      checklist={checklist}
      onUpdate={setChecklist}                              // ✅ không còn () => {}
      readOnly={checklist.status === 'approved'}
    />
  )
}
