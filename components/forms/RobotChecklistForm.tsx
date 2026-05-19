'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Minus, Loader2, Save } from 'lucide-react'

import {
  RobotChecklist,
  RobotCheckItem,
  RobotDayEntry,
  getDaysInMonth
} from '@/lib/robot-checklist-data'

// ===== TYPES =====
type RichItem = RobotCheckItem & {
  days: Record<string, RobotDayEntry>
}

// ===== UTILS =====
function normalizeStatus(status: any) {
  return (status || '').toString().trim().toLowerCase()
}

// ✅ FIX KEY MISMATCH (QUAN TRỌNG NHẤT)
function buildItems(
  template: RobotCheckItem[],
  day_entries: RobotChecklist['day_entries'],
  month: number,
  year: number
): RichItem[] {
  const totalDays = getDaysInMonth(month, year)

  return template.map(item => {
    const itemKey = String(item.id).trim().toLowerCase()
    const days: Record<string, RobotDayEntry> = {}

    for (let d = 1; d <= totalDays; d++) {
      const day = String(d)
      const dayData = day_entries?.[day] || {}

      const entry = Object.entries(dayData).find(([k]) =>
        k.trim().toLowerCase() === itemKey
      )?.[1]

      days[day] = entry || {
        status: '',
        note: '',
        image_url: '',
      }
    }

    return { ...item, days }
  })
}

// ✅ stringify id khi save
function toDayEntries(items: RichItem[]) {
  const result: any = {}

  items.forEach(item => {
    const key = String(item.id)

    Object.entries(item.days).forEach(([day, entry]) => {
      const s = normalizeStatus(entry?.status)

      if (s === 'pass' || s === 'fail' || entry?.note || entry?.image_url) {
        if (!result[day]) result[day] = {}
        result[day][key] = entry
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

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [activeDay, setActiveDay] = useState<number>(() => {
    const today = new Date().getDate()
    const max = getDaysInMonth(checklist.month, checklist.year)
    return today <= max ? today : 1
  })

  const daysCount = getDaysInMonth(checklist.month, checklist.year)
  const days = Array.from({ length: daysCount }, (_, i) => i + 1)

  // ===== STATUS =====
  const cycleStatus = useCallback((itemId: string, day: number) => {
    if (readOnly) return

    setItems(prev =>
      prev.map(item => {
        if (String(item.id) !== String(itemId)) return item

        const key = String(day)
        const current = normalizeStatus(item.days[key]?.status)

        const next =
          current === '' ? 'pass'
          : current === 'pass' ? 'fail'
          : ''

        return {
          ...item,
          days: {
            ...item.days,
            [key]: {
              ...(item.days[key] || {}),
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
          day_entries: toDayEntries(items)
        })
      })

      if (!res.ok) throw new Error()

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)

      // ✅ SERVER SOURCE OF TRUTH
      router.refresh()

    } catch {
      alert('❌ Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">

      {/* DAY SELECT */}
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
      <table className="w-full border text-sm">
        <tbody>
          {items.map((item, i) => {
            const status = normalizeStatus(
              item.days[String(activeDay)]?.status
            )

            return (
              <tr key={item.id} className="border-t">
                <td className="px-2">{i + 1}</td>
                <td>{item.label_vi}</td>
                <td className="text-center">
                  <button onClick={() => cycleStatus(String(item.id), activeDay)}>
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
