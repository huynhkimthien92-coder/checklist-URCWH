'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RobotChecklist, RobotCheckItem } from '@/lib/robot-checklist-data'

// ===== TYPES =====
type Props = {
  checklist: RobotChecklist
  readOnly?: boolean
  isSupervisor?: boolean
}

// ===== COMPONENT =====
export function RobotChecklistForm({
  checklist,
  readOnly = false,
  isSupervisor = false
}: Props) {

  const router = useRouter()

  const [items, setItems] = useState<RobotCheckItem[]>(checklist.items)
  const [opSigs, setOpSigs] = useState(checklist.operator_signatures || {})
  const [supSigs, setSupSigs] = useState(checklist.supervisor_signatures || {})
  const [notes, setNotes] = useState(checklist.notes || '')
  const [saving, setSaving] = useState(false)

  const today = new Date().getDate()
  const [activeDay, setActiveDay] = useState(String(today))

  const daysInMonth = new Date(checklist.year, checklist.month, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => String(i + 1))

  // ===================== UPDATE =====================
  const updateStatus = (itemId: string) => {
    if (readOnly) return

    setItems(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item

        const current = item.days?.[activeDay]?.status || ''

        const next =
          current === '' ? 'pass'
            : current === 'pass' ? 'fail'
            : ''

        return {
          ...item,
          days: {
            ...item.days,
            [activeDay]: {
              ...item.days[activeDay],
              status: next
            }
          }
        }
      })
    )
  }

  // ===================== HELPERS =====================
  const hasData = (day: string) =>
    items.some(i => {
      const s = i.days?.[day]?.status
      return s === 'pass' || s === 'fail'
    })

  const isSigned = (day: string, sigs: any) =>
    !!sigs?.[day]?.data_url

  const getDaysWithData = () => {
    const d = new Set<string>()
    items.forEach(item => {
      Object.entries(item.days).forEach(([day, val]) => {
        if (val.status === 'pass' || val.status === 'fail') {
          d.add(day)
        }
      })
    })
    return Array.from(d)
  }

  // ===================== SAVE =====================
  const save = async (extra?: any) => {
    setSaving(true)

    await fetch(`/api/robot-checklist/${checklist.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items,
        operator_signatures: opSigs,
        supervisor_signatures: supSigs,
        notes,
        ...extra
      })
    })

    setSaving(false)
    router.refresh()
  }

  // ===================== SUBMIT =====================
  const submit = async () => {
    const days = getDaysWithData()

    if (days.length === 0) {
      alert('⚠️ Chưa có dữ liệu')
      return
    }

    const unsigned = days.filter(d => !opSigs[d]?.data_url)

    if (unsigned.length > 0) {
      alert(`⚠️ Chưa ký ngày: ${unsigned.join(', ')}`)
      return
    }

    await save({ status: 'submitted' })
    alert('✅ Đã nộp')
  }

  // ===================== APPROVE =====================
  const approve = async () => {
    const days = getDaysWithData()

    const unsigned = days.filter(d => !supSigs[d]?.data_url)

    if (unsigned.length > 0) {
      alert(`⚠️ Supervisor chưa ký: ${unsigned.join(', ')}`)
      return
    }

    await save({ status: 'approved' })
    alert('✅ Đã duyệt')
  }

  // ===================== SIGN =====================
  const sign = (day: string) => {
    const fakeSignature = {
      data_url: 'signed',
      signed_at: new Date().toISOString(),
      user_name: 'User'
    }

    if (isSupervisor) {
      setSupSigs(prev => ({ ...prev, [day]: fakeSignature }))
    } else {
      setOpSigs(prev => ({ ...prev, [day]: fakeSignature }))
    }
  }

  // ===================== UI =====================
  return (
    <div className="space-y-4">

      {/* DAY PICKER */}
      <div className="flex flex-wrap gap-1">
        {days.map(day => {
          const data = hasData(day)
          const signed = isSigned(day, isSupervisor ? supSigs : opSigs)
          const active = day === activeDay

          let style = 'bg-gray-100 text-gray-500'

          if (data && !signed) style = 'bg-red-100 text-red-600'
          if (data && signed) style = 'bg-green-100 text-green-700'
          if (active) style = 'bg-blue-600 text-white'

          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`w-8 h-8 text-xs rounded ${style}`}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* ITEMS */}
      <table className="w-full border text-sm">
        <tbody>
          {items.map((item, i) => {
            const entry = item.days?.[activeDay] || {}

            return (
              <tr key={item.id} className="border-t">
                <td className="px-2">{i + 1}</td>
                <td className="px-2">{item.label_vi}</td>

                <td className="px-2 text-center">
                  <button onClick={() => updateStatus(item.id)}>
                    {entry.status === 'pass' ? '✓' :
                      entry.status === 'fail' ? 'X' : '-'}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* SIGN */}
      <div>
        <button
          onClick={() => sign(activeDay)}
          className="bg-black text-white px-3 py-1 rounded"
        >
          Ký ngày {activeDay}
        </button>
      </div>

      {/* NOTES */}
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        className="w-full border p-2"
        placeholder="Ghi chú..."
      />

      {/* ACTIONS */}
      {!readOnly && (
        <div className="flex gap-2">

          <button
            onClick={() => save()}
            className="bg-gray-500 text-white px-3 py-1 rounded"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>

          {!isSupervisor && checklist.status === 'draft' && (
            <button
              onClick={submit}
              className="bg-blue-600 text-white px-3 py-1 rounded"
            >
              Submit
            </button>
          )}

          {isSupervisor && checklist.status === 'submitted' && (
            <button
              onClick={approve}
              className="bg-green-600 text-white px-3 py-1 rounded"
            >
              Approve
            </button>
          )}
        </div>
      )}
    </div>
  )
}
