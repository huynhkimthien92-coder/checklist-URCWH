'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  CheckCircle,
  XCircle,
  Minus,
  Loader2,
  Save
} from 'lucide-react'

import { RobotChecklist } from '@/lib/robot-checklist-data'

// ===== TYPES =====
type Item = {
  id: string
  label_vi: string
  category?: string
  days: Record<string, {
    status?: string
    note?: string
    image_url?: string
  }>
}

// ===== COMPONENT =====
interface Props {
  checklist: RobotChecklist
  readOnly?: boolean
}

export function RobotChecklistForm({ checklist, readOnly }: Props) {
  const router = useRouter()
  const { data: session } = useSession()

  // ✅ GIỐNG XE NÂNG 100%
  const [items, setItems] = useState<Item[]>(checklist.items || [])

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const today = new Date().getDate()
  const [activeDay, setActiveDay] = useState<string>(String(today))

  const daysInMonth = new Date(
    checklist.year,
    checklist.month,
    0
  ).getDate()

  const days = Array.from({ length: daysInMonth }, (_, i) => String(i + 1))

  // ===== STATUS =====
  const updateStatus = useCallback((itemId: string, day: string) => {
    if (readOnly) return

    setItems(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item

        const current = item.days?.[day]?.status || ''

        const next =
          current === '' ? 'pass'
            : current === 'pass' ? 'fail'
            : ''

        return {
          ...item,
          days: {
            ...item.days,
            [day]: {
              ...(item.days?.[day] || {}),
              status: next
            }
          }
        }
      })
    )
  }, [readOnly])

  // ===== SAVE =====
  const save = async () => {
    setSaving(true)

    try {
      const res = await fetch(`/api/robot-checklist/${checklist.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items // ✅ giống xe nâng
        })
      })

      if (!res.ok) throw new Error()

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)

      // ✅ reload từ server
      router.refresh()

    } catch {
      alert('❌ Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  // ===== UI =====
  return (
    <div className="space-y-4">

      {/* DAY PICKER */}
      <div className="flex flex-wrap gap-1">
        {days.map(day => {
          const hasData = items.some(i => i.days?.[day]?.status)

          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`w-8 h-8 text-xs rounded ${
                activeDay === day
                  ? 'bg-blue-600 text-white'
                  : hasData
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-600'
              }`}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* TABLE */}
      <table className="w-full text-sm border">
        <tbody>
          {items.map((item, idx) => {
            const entry = item.days?.[activeDay] || {}
            const status = entry.status || ''

            return (
              <tr key={item.id} className="border-t">
                <td className="px-2">{idx + 1}</td>
                <td className="px-2">{item.label_vi}</td>

                <td className="text-center px-2">
                  <button onClick={() => updateStatus(item.id, activeDay)}>
                    {status === 'pass' && <CheckCircle className="text-green-600" />}
                    {status === 'fail' && <XCircle className="text-red-600" />}
                    {status === '' && <Minus className="text-slate-300" />}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* SAVE */}
      {!readOnly && (
        <button
          onClick={save}
          disabled={saving}
          className="btn-secondary flex items-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          <Save className="w-4 h-4" />
          {saving ? 'Đang lưu...' : saved ? '✓ Đã lưu' : 'Lưu'}
        </button>
      )}

    </div>
  )
}
