'use client'

import { RobotChecklistForm } from '@/components/forms/RobotChecklistForm'

export default function RobotChecklistClient({ checklist }: any) {
  return (
    <RobotChecklistForm
      checklist={checklist}
      onUpdate={() => {}}
      readOnly={checklist.status === 'approved'}
    />
  )
}
