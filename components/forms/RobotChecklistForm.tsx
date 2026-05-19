'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RobotChecklist, RobotCheckItem } from '@/lib/robot-checklist-data'

// ================= TYPE =================
type Props = {
  checklist: RobotChecklist
  readOnly?: boolean
  isSupervisor?: boolean
}

// ================= HELPER =================
function groupByCategory(items: RobotCheckItem[]) {
  const map: Record<string, RobotCheckItem[]> = {}

  items.forEach(item => {
    if (!map[item.category]) {
      map[item.category] = []
    }
    map[item.category].push(item)
  })

  return map
}

// ================= COMPONENT =================
export function RobotChecklistForm({
  checklist,
  readOnly = false,
  isSupervisor = false
}: Props) {

  const router = useRouter()

  const [items, setItems] = useState<RobotCheckItem[]>(checklist.items)
  const [notes, setNotes] = useState(checklist.notes || '')
  const [saving, setSaving] = useState(false)

  const today = new Date().getDate()
  const [activeDay, setActiveDay] = useState(String(today))

  const daysInMonth = new Date(checklist.year, checklist.month, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => String(i + 1))

  // ================= UPDATE =================
  const updateStatus = (itemId: string) => {
    if (readOnly) return

    setItems(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item

        const current = item.days?.[activeDay]?.status || ''

        const next =
          current === '' ? 'pass' :
          current === 'pass' ? 'fail' :
          ''

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

  // ================= SAVE =================
  const save = async (extra?: any) => {
    setSaving(true)

    await fetch(`/api/robot-checklist/${checklist.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items,
        notes,
        ...extra
      })
    })

    setSaving(false)
    router.refresh()
  }

  // ================= GROUP =================
  const grouped = groupByCategory(items)

  // ================= UI =================
  return (
    <div className="space-y-4">

      {/* ===== DAY PICKER ===== */}
      <div className="flex flex-wrap gap-1">
        {days.map(day => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`
              w-8 h-8 text-xs rounded
              ${day === activeDay ? 'bg-blue-600 text-white' : 'bg-gray-100'}
            `}
          >
            {day}
          </button>
        ))}
      </div>

      {/* ===== TABLE ===== */}
      <table className="w-full border text-sm">

        <tbody>
          {Object.entries(grouped).map(([category, list]) => {

            let index = 1

            return (
              <>
                {/* CATEGORY HEADER */}
                <tr key={category}>
                  <td
                    colSpan={3}
                    className="bg-indigo-600 text-white font-semibold px-2 py-1"
                  >
                    {category}
                  </td>
                </tr>

                {/* ITEMS */}
                {list.map(item => {
                  const entry = item.days?.[activeDay]

                  return (
                    <tr key={item.id} className="border-t">
                      <td className="w-10 text-center">{index++}</td>

                      <td className="px-2">
                        {item.label_vi}
                      </td>

                      <td className="w-16 text-center">
                        <button
                          onClick={() => updateStatus(item.id)}
                          className="
                            w-8 h-8 rounded border
                            hover:bg-gray-100
                          "
                        >
                          {entry?.status === 'pass'
                            ? '✓'
                            : entry?.status === 'fail'
                            ? 'X'
                            : '-'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </>
            )
          })}
        </tbody>
      </table>

      {/* ===== NOTES ===== */}
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        className="w-full border p-2"
        placeholder="Ghi chú..."
      />

      {/* ===== ACTION ===== */}
      {!readOnly && (
        <div className="flex gap-2">

          <button
            onClick={() => save()}
            className="bg-gray-600 text-white px-3 py-1 rounded"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>

          <button
            onClick={() => save({ status: 'submitted' })}
            className="bg-blue-600 text-white px-3 py-1 rounded"
          >
            Submit
          </button>

        </div>
      )}
    </div>
  )
}
