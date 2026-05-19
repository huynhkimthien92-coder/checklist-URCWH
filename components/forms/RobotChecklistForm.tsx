'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle,
  XCircle,
  Minus,
  Download,
  Plus,
  Trash2,
  Loader2,
  Save
} from 'lucide-react'
import {
  RobotChecklist,
  RobotCheckItem,
  RobotDayEntry,
  getDaysInMonth
} from '@/lib/robot-checklist-data'
import { SignaturePad } from '@/components/forms/SignaturePad'

// ===== TYPES =====
type RichItem = RobotCheckItem & {
  days: Record<string, RobotDayEntry>
}

// ===== UTILS =====
function normalizeStatus(status: any) {
  return (status || '').toString().trim().toLowerCase()
}

function buildItems(
  template: RobotCheckItem[],
  day_entries: RobotChecklist['day_entries'],
  month: number,
  year: number
): RichItem[] {
  const totalDays = getDaysInMonth(month, year)

  return template.map(item => {
    const days: Record<string, RobotDayEntry> = {}

    for (let d = 1; d <= totalDays; d++) {
      const day = String(d)
      const dayData = day_entries?.[day] || {}

      const entry =
        dayData?.[item.id] ||
        dayData?.[String(item.id)] ||
        Object.entries(dayData).find(
          ([key]) =>
            key.trim().toLowerCase() === String(item.id).trim().toLowerCase()
        )?.[1]

      days[day] = entry || {
        status: '',
        note: '',
        image_url: ''
      }
    }

    return { ...item, days }
  })
}

function toDayEntries(items: RichItem[]): RobotChecklist['day_entries'] {
  const result: any = {}

  items.forEach(item => {
    Object.entries(item.days).forEach(([day, entry]) => {
      const s = normalizeStatus(entry?.status)

      if (s === 'pass' || s === 'fail' || entry?.note || entry?.image_url) {
        if (!result[day]) result[day] = {}
        result[day][item.id] = entry
      }
    })
  })

  return result
}

// ===== COMPONENT =====
interface Props {
  checklist: RobotChecklist
  readOnly?: boolean
}

export function RobotChecklistForm({ checklist, readOnly }: Props) {
  const { data: session } = useSession()
  const router = useRouter()

  // ✅ init giống xe nâng
  const [items, setItems] = useState<RichItem[]>(() =>
    buildItems(
      checklist.items || [],
      checklist.day_entries || {},
      checklist.month,
      checklist.year
    )
  )

  const [opSigs, setOpSigs] = useState(checklist.operator_signatures || {})
  const [supSigs, setSupSigs] = useState(checklist.supervisor_signatures || {})
  const [incidents, setIncidents] = useState(checklist.incidents || [])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)

  const [activeDay, setActiveDay] = useState<number>(() => {
    const today = new Date().getDate()
    const daysInMonth = getDaysInMonth(checklist.month, checklist.year)
    return today <= daysInMonth ? today : 1
  })

  const daysCount = getDaysInMonth(checklist.month, checklist.year)
  const days = Array.from({ length: daysCount }, (_, i) => i + 1)

  // ===== UPDATE =====
  const cycleStatus = useCallback((id: string, day: number) => {
    if (readOnly) return

    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item

        const key = String(day)
        const current = normalizeStatus(item.days[key]?.status)

        const next =
          current === '' ? 'pass' : current === 'pass' ? 'fail' : ''

        return {
          ...item,
          days: {
            ...item.days,
            [key]: {
              ...(item.days[key] || { note: '', image_url: '' }),
              status: next
            }
          }
        }
      })
    )

    setDirty(true)
    setSaved(false)
  }, [readOnly])

  // ===== SAVE =====
  const save = async (extra?: any) => {
    setSaving(true)

    try {
      const res = await fetch(`/api/robot-checklist/${checklist.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day_entries: toDayEntries(items),
          operator_signatures: opSigs,
          supervisor_signatures: supSigs,
          incidents,
          ...extra
        })
      })

      if (!res.ok) throw new Error()

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)

      // ✅ giống xe nâng
      router.refresh()

    } catch {
      alert('❌ Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  // ===== RENDER =====
  return (
    <div className="space-y-4">

      {/* DAY PICKER */}
      <div className="flex gap-1 flex-wrap">
        {days.map(d => {
          const hasData = items.some(item => {
            const s = normalizeStatus(item.days[String(d)]?.status)
            return s === 'pass' || s === 'fail'
          })

          return (
            <button
              key={d}
              onClick={() => setActiveDay(d)}
              className={`w-8 h-8 text-xs rounded ${
                activeDay === d
                  ? 'bg-blue-600 text-white'
                  : hasData
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {d}
            </button>
          )
        })}
      </div>

      {/* TABLE */}
      <table className="w-full text-sm border">
        <tbody>
          {items.map((item, idx) => {
            const status = normalizeStatus(item.days[String(activeDay)]?.status)

            return (
              <tr key={item.id} className="border-t">
                <td className="px-2">{idx + 1}</td>
                <td>{item.label_vi}</td>
                <td className="text-center">
                  <button onClick={() => cycleStatus(item.id, activeDay)}>
                    {status === 'pass' && <CheckCircle />}
                    {status === 'fail' && <XCircle />}
                    {status === '' && <Minus />}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* ACTION */}
      {!readOnly && (
        <button
          onClick={() => save()}
          disabled={saving}
          className="btn-secondary"
        >
          {saving ? 'Đang lưu...' : 'Lưu'}
        </button>
      )}

    </div>
  )
}
``
