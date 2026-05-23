'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  RobotChecklist,
  RobotCheckItem
} from '@/lib/robot-checklist-data'

import { SignaturePad } from '@/components/forms/SignaturePad'
import { ImageUploader } from '@/components/forms/ImageUploader'

// ===== TYPES =====
type Props = {
  checklist: RobotChecklist
  readOnly?: boolean
  isSupervisor?: boolean
}

// ===== GROUP =====
function groupByCategory(items: RobotCheckItem[]) {
  const map: Record<string, RobotCheckItem[]> = {}

  items.forEach(i => {
    if (!map[i.category]) map[i.category] = []
    map[i.category].push(i)
  })

  return map
}

// ===== COMPONENT =====
export function RobotChecklistForm({
  checklist,
  readOnly = false,
  isSupervisor = false,
}: Props) {

  const router = useRouter()

  const [items, setItems] = useState(checklist.items)
  const [notes, setNotes] = useState(checklist.notes || '')
  const [saving, setSaving] = useState(false)

  const [opSigs, setOpSigs] = useState(checklist.operator_signatures || {})
  const [supSigs, setSupSigs] = useState(checklist.supervisor_signatures || {})
  const [originalItems] = useState(() =>
    structuredClone(checklist.items)
  )

  const today = new Date().getDate()
  const [activeDay, setActiveDay] = useState(String(today))

  const daysInMonth = new Date(checklist.year, checklist.month, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => String(i + 1))

  // ================= ✅ LOCK LOGIC =================
  const hasCheckedData = (day: string) =>
    items.some(i => {
      const st = i.days?.[day]?.status
      return st === 'pass' || st === 'fail'
    })
  const isAnyLockedModified = () => {
    return items.some((item, i) => {

      const original = originalItems[i]

      return Object.keys(item.days || {}).some(day => {

        const prev = original?.days?.[day]
        const curr = item.days?.[day]

        // ✅ skip ngày mới
        if (!prev) return false

        // ✅ skip nếu không phải ngày đã ký
        if (!isDayLocked(day)) return false

        // ✅ skip nếu không thay đổi gì
        if (
          (prev?.status ?? '') === (curr?.status ?? '') &&
          (prev?.note ?? '') === (curr?.note ?? '') &&
          (prev?.image_url ?? '') === (curr?.image_url ?? '')
        ) {
          return false
        }

        return true
      })
    })
  }
  const missingOperatorSig = (day: string) =>
    hasCheckedData(day) && !opSigs?.[day]?.data_url
  
  const missingSupervisorSig = (day: string) =>
    hasCheckedData(day) && !supSigs?.[day]?.data_url
  const isDayLocked = (day: string) =>
    !!opSigs?.[day]?.data_url


  const isDisabled = readOnly || (!isSupervisor && isDayLocked(activeDay))
  const grouped = groupByCategory(items)

  // ================= UPDATE =================
  const updateStatus = (itemId: string) => {
    if (isDisabled) return

    setItems(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item

        const cur = item.days?.[activeDay]?.status || ''
        const next = cur === '' ? 'pass' : cur === 'pass' ? 'fail' : ''

        return {
          ...item,
          days: {
            ...item.days,
            [activeDay]: {
              ...(item.days?.[activeDay] || {}),
              status: next
            }
          }
        }
      })
    )
  }

  const updateNote = (itemId: string, note: string) => {
    if (isDisabled) return

    setItems(prev =>
      prev.map(i =>
        i.id === itemId
          ? {
              ...i,
              days: {
                ...i.days,
                [activeDay]: {
                  ...(i.days?.[activeDay] || {}),
                  note
                }
              }
            }
          : i
      )
    )
  }

  const updateImage = (itemId: string, url: string) => {
    if (isDisabled) return

    setItems(prev =>
      prev.map(i =>
        i.id === itemId
          ? {
              ...i,
              days: {
                ...i.days,
                [activeDay]: {
                  ...(i.days?.[activeDay] || {}),
                  image_url: url
                }
              }
            }
          : i
      )
    )
  }

  // ================= SAVE =================
  const save = async (extra?: any) => {

    if (!isSupervisor && isAnyLockedModified()) {
      alert('⚠️ Bạn đang chỉnh sửa ngày đã ký ❌')
      return
    }

    setSaving(true)

    await fetch(`/api/robot-checklist/${checklist.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items,
        notes,
        operator_signatures: opSigs,
        supervisor_signatures: supSigs,
        ...extra
      })
    })

    setSaving(false)
    router.refresh()
  }

  // ================= UI =================
  return (
    <div className="space-y-4">
      {/* ===== DAY PICKER ===== */}
      <div className="flex flex-wrap gap-1">
        {days.map(day => {
          const has = hasCheckedData(day)
          const opSigned = !!opSigs?.[day]?.data_url
          const supSigned = !!supSigs?.[day]?.data_url
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`
                relative w-8 h-8 text-xs rounded
                ${activeDay === day ? 'bg-blue-600 text-white' : ''}
                ${has && !opSigned ? 'bg-yellow-200' : ''}
              
                ${has && opSigned ? 'bg-green-200' : ''}
              `}
            >
              {day}
              {missingSupervisorSig(day) && (<span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full" />)}

            </button>
          )
        })}
      </div>

      {/* ✅ LOCK INFO */}
      {isDayLocked(activeDay) && (
        <div className="text-xs text-red-500">
          🔒 Ngày đã được ký bởi{' '}
          <span className="font-semibold">
            {opSigs?.[activeDay]?.user_name || 'operator'}
          </span>{' '}
          - không thể chỉnh sửa
        </div>
      )}

      {/* ===== TABLE ===== */}
      <table className="w-full border text-sm table-fixed">
        <tbody>
          {Object.entries(grouped).map(([category, list]) => (
            <tbody key={category}>
              <tr>
                <td colSpan={3} className="bg-indigo-600 text-white px-2 py-1">
                  {category}
                </td>
              </tr>

              {list.map((item, idx) => {
                const entry = item.days?.[activeDay]
                const isPass = entry?.status === 'pass'
                const isFail = entry?.status === 'fail'

                return (
                  <tr key={item.id} className={`${isPass ? 'bg-green-50' : ''} ${isFail ? 'bg-red-50' : ''}`}>
                    <td className="w-10 text-center">{idx + 1}</td>

                    <td className="px-2">
                      {item.label_vi}

                      {isFail && (
                        <div className="mt-2 space-y-2">

                          <textarea
                            disabled={isDisabled}
                            value={entry?.note || ''}
                            onChange={e => updateNote(item.id, e.target.value)}
                            className="w-full border text-xs p-1 rounded"
                          />

                          <ImageUploader
                            disabled={isDisabled}
                            checklistId={checklist.id}
                            itemId={item.id}
                            day={activeDay}
                            value={entry?.image_url}
                            onChange={(url) => updateImage(item.id, url)}
                          />

                        </div>
                      )}
                    </td>

                    <td className="text-center">
                      <button
                        disabled={isDisabled}
                        onClick={() => updateStatus(item.id)}
                        className={`w-8 h-8 border rounded
                          ${isPass ? 'bg-green-600 text-white' : ''}
                          ${isFail ? 'bg-red-500 text-white' : ''}`}
                      >
                        {isPass ? '✓' : isFail ? 'X' : '-'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          ))}
        </tbody>
      </table>

      {/* ===== SIGNATURE ===== */}
      <div className="flex gap-4 flex-wrap">

        <SignaturePad
          checklistId={checklist.id}
          day={activeDay}
          role="operator"
          label="Ký Operator"
          existingSignature={opSigs?.[activeDay]?.data_url}
          onSave={(url) =>
            setOpSigs(prev => ({
              ...prev,
              [activeDay]: url
                ? {
                    data_url: url,
                    signed_at: new Date().toISOString(),
                    user_name: 'Operator'
                  }
                : null
            }))
          }
        />

        {isSupervisor && (
          <SignaturePad
            checklistId={checklist.id}
            day={activeDay}
            role="supervisor"
            label="Ký Supervisor"
            existingSignature={supSigs?.[activeDay]?.data_url}
            onSave={(url) =>
              setSupSigs(prev => ({
                ...prev,
                [activeDay]: url
                  ? {
                      data_url: url,
                      signed_at: new Date().toISOString(),
                      user_name: 'Supervisor'
                    }
                  : null
              }))
            }
          />
        )}

      </div>

      {/* NOTES */}
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        disabled={readOnly}
        className="w-full border p-2"
        placeholder="Ghi chú..."
      />

      {/* ACTION */}
      {!readOnly && (
        <div className="flex gap-2">
          <button onClick={() => save()} className="bg-gray-600 text-white px-3 py-1 rounded">
            {saving ? 'Saving...' : 'Save'}
          </button>

          {!isSupervisor && (
            <button onClick={() =>{
              const invalid = days.filter(day => missingOperatorSig(day))
              if (invalid.length) {
                alert(`⚠️ Chưa ký các ngày: ${invalid.join(', ')}`)
                return
              }
              save({ status: 'submitted' })}} className="bg-blue-600 text-white px-3 py-1 rounded">
              Submit
            </button>
          )}

          {isSupervisor && (
            <button onClick={() => {
              const invalid = days.filter(day => missingSupervisorSig(day))
              if (invalid.length) {
                alert(`⚠️ Supervisor chưa ký: ${invalid.join(', ')}`)
                return
              } 
              save({ status: 'approved' })}} className="bg-green-600 text-white px-3 py-1 rounded">
              Approve
            </button>
          )}
        </div>
      )}

    </div>
  )
}
