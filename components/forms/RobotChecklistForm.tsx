'use client'
// components/forms/RobotChecklistForm.tsx
import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { CheckCircle, XCircle, Minus, Download, Plus, Trash2, Loader2 } from 'lucide-react'
import { RobotChecklist, RobotCheckItem, getDaysInMonth } from '@/lib/robot-checklist-data'
import { SignaturePad } from '@/components/forms/SignaturePad'
import { useRouter } from 'next/navigation'

interface Props {
  checklist: RobotChecklist
  onUpdate: (updated: RobotChecklist) => void
  readOnly?: boolean
}





const STATUS_CYCLE = ['', 'pass', 'fail'] as const

export function RobotChecklistForm({ checklist, onUpdate, readOnly }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const [opSigs, setOpSigs] = useState(checklist.operator_signatures || {})
  const [supSigs, setSupSigs] = useState(checklist.supervisor_signatures || {})
  const signDay = async (day: number, dataUrl: string, isSuper: boolean) => {
    const sig = {
      data_url: dataUrl,
      signed_at: new Date().toISOString(),
      user_id: (session?.user as any)?.id,
      user_name: (session?.user as any)?.name,
    }

    let updated

    if (isSuper) {
      updated = {
        ...checklist,
        supervisor_signatures: { ...supSigs, [day]: sig },
      }
      setSupSigs(updated.supervisor_signatures)
    } else {
      updated = {
        ...checklist,
        operator_signatures: { ...opSigs, [day]: sig },
      }
      setOpSigs(updated.operator_signatures)
    }

    onUpdate(updated)

    await fetch(`/api/robot-checklist/${checklist.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operator_signatures: updated.operator_signatures,
        supervisor_signatures: updated.supervisor_signatures,
      }),
    })
  }
  const isDaySignedByOperator = (day: number) =>
    !!opSigs?.[day]?.data_url

  const isDaySignedBySupervisor = (day: number) =>
    !!supSigs?.[day]?.data_url

  const canSignDay = (day: number, isSuper: boolean) => {
    if (readOnly) return false

    if (isSuper) {
    return checklist.status === 'submitted'
    }

    return checklist.status === 'draft'
  }

  const isDayLocked = (day: number) => {
    return isDaySignedByOperator(day)
  }

  const role = (session?.user as any)?.role
  const isSupervisor = role === 'supervisor' || role === 'admin'

  const [saving, setSaving] = useState(false)
  const [activeDay, setActiveDay] = useState<number>(new Date().getDate())

  const daysCount = getDaysInMonth(checklist.month, checklist.year)
  const days = Array.from({ length: daysCount }, (_, i) => i + 1)

  // Cycle status: '' → pass → fail → ''
  const cycleStatus = useCallback(async (itemId: string, day: number) => {
    if (readOnly) return
    const current = checklist.day_entries?.[String(day)]?.[itemId]?.status || ''
    const next = current === '' ? 'pass' : current === 'pass' ? 'fail' : ''

    const updated: RobotChecklist = {
      ...checklist,
      day_entries: {
        ...checklist.day_entries,
        [String(day)]: {
          ...checklist.day_entries?.[String(day)],
          [itemId]: {
            ...checklist.day_entries?.[String(day)]?.[itemId],
            status: next,
          },
        },
      },
    }
    onUpdate(updated)
    setSaving(true)
    try {
      await fetch(`/api/robot-checklist/${checklist.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day_entries: updated.day_entries }),
      })
    } finally {
      setSaving(false)
    }
  }, [checklist, onUpdate, readOnly])

  const addIncident = () => {
    const updated = {
      ...checklist,
      incidents: [...(checklist.incidents || []), { incident: '', date: '', receiver: '' }],
    }
    onUpdate(updated)
  }

  const updateIncident = async (idx: number, field: string, value: string) => {
    const incidents = [...(checklist.incidents || [])]
    incidents[idx] = { ...incidents[idx], [field]: value }
    const updated = { ...checklist, incidents }
    onUpdate(updated)
    await fetch(`/api/robot-checklist/${checklist.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incidents }),
    })
  }


  const removeIncident = async (idx: number) => {
    const incidents = checklist.incidents.filter((_, i) => i !== idx)
    const updated = { ...checklist, incidents }
    onUpdate(updated)
    await fetch(`/api/robot-checklist/${checklist.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incidents }),
    })
  }

  const exportPDF = async () => {
    const res = await fetch(`/api/robot-checklist/${checklist.id}/pdf`)
    if (!res.ok) return alert('Xuất PDF thất bại')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `robot-checklist-${checklist.robot_number}-${checklist.month}-${checklist.year}.pdf`
    a.click()
  }

  const submit = async () => {
  // ✅ check signature trước khi submit
  const daysWithData = Object.keys(checklist.day_entries || {})

  const unsignedDays = daysWithData.filter(day => !opSigs?.[day]?.data_url)

  if (daysWithData.length === 0) {
    alert('⚠️ Bạn chưa nhập dữ liệu checklist')
    return
  }

  if (unsignedDays.length > 0) {
    alert(`⚠️ Bạn chưa ký các ngày: ${unsignedDays.join(', ')}`)
    return
  }

  setSaving(true)

  try {
    await fetch(`/api/robot-checklist/${checklist.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'submitted',
        operator_signatures: opSigs,
      }),
    })

    alert('✅ Đã nộp checklist')
  } finally {
    setSaving(false)
  }
}
  
  // Group items by category
  const categories = Array.from(new Set(checklist.items.map(i => i.category)))

  return (
    <div className="space-y-4">
      {/* Header info */}
      <div className="flex items-center justify-between">
        <div>
          
          <button
            onClick={() => router.push('/')}
            className="text-sm text-blue-600 hover:underline"
          >
          ← Quay lại
          </button>

          <h2 className="text-lg font-bold text-slate-800">
            Robot: {checklist.robot_number}
          </h2>
          <p className="text-sm text-slate-500">
            Tháng {checklist.month}/{checklist.year} · {checklist.area}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saving && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
          <button onClick={exportPDF} className="btn-secondary flex items-center gap-1.5">
            <Download className="w-4 h-4" /> Xuất PDF
          </button>
        </div>
      </div>

      {/* Day selector */}
      <div className="flex gap-1 flex-wrap">
        {days.map(d => {
          const hasAny = checklist.items.some(item =>
            checklist.day_entries?.[String(d)]?.[item.id]?.status
          )
          return (
            <button
              key={d}
              onClick={() => setActiveDay(d)}
              className={`w-8 h-8 text-xs rounded font-medium transition-colors ${
                activeDay === d
                  ? 'bg-blue-600 text-white'
                  : hasAny
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {d}
            </button>
          )
        })}
      </div>

      {/* Checklist table for active day */}
      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="text-left px-3 py-2 w-8">#</th>
              <th className="text-left px-3 py-2 w-28">Nhóm</th>
              <th className="text-left px-3 py-2">Công việc</th>
              <th className="text-center px-3 py-2 w-24">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => {
              const catItems = checklist.items.filter(i => i.category === cat)
              return catItems.map((item, idx) => {
                const entry = checklist.day_entries?.[String(activeDay)]?.[item.id]
                const status = entry?.status || ''
                const bg = status === 'pass' ? 'bg-green-50' : status === 'fail' ? 'bg-red-50' : ''
                return (
                  <tr key={item.id} className={`border-t ${bg} hover:bg-opacity-80`}>
                    <td className="px-3 py-2 text-slate-500 text-xs">
                      {checklist.items.indexOf(item) + 1}
                    </td>
                    {idx === 0 && (
                      <td
                        rowSpan={catItems.length}
                        className="px-3 py-2 font-semibold text-xs text-slate-700 bg-slate-50 border-r align-middle"
                      >
                        {cat}
                      </td>
                    )}
                    <td className="px-3 py-2 text-slate-700">{item.label_vi}</td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => cycleStatus(item.id, activeDay)}
                        disabled={readOnly || isDayLocked(activeDay)}
                        className="p-1 rounded-full hover:bg-slate-100 transition-colors"
                      >
                        {status === 'pass' && <CheckCircle className="w-6 h-6 text-green-600" />}
                        {status === 'fail' && <XCircle className="w-6 h-6 text-red-600" />}
                        {status === '' && <Minus className="w-6 h-6 text-slate-300" />}
                      </button>
                    </td>
                  </tr>
                )
              })
            })}
          </tbody>
        </table>
      </div>
      
{/* Signature */}
<div className="space-y-2 mt-4">
  <div className="flex items-center justify-between">
    <label className="text-sm font-semibold text-slate-700">
      {isSupervisor ? '🔏 Ký Supervisor' : '✍️ Ký Operator'}
    </label>

    {(isSupervisor
      ? isDaySignedBySupervisor(activeDay)
      : isDaySignedByOperator(activeDay)
    ) && (
      <span className="text-xs px-2 py-0.5 rounded-full border bg-green-100 text-green-700">
        ✓ Đã ký
      </span>
    )}
  </div>

  {isSupervisor && checklist.status !== 'submitted' && (
    <div className="text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border">
      Chỉ ký được khi checklist đã submit
    </div>
  )}

  <SignaturePad
    onSave={(url) => signDay(activeDay, url, isSupervisor)}
    existingSignature={
      isSupervisor
        ? supSigs?.[activeDay]?.data_url || null
        : opSigs?.[activeDay]?.data_url || null
    }
    disabled={!canSignDay(activeDay, isSupervisor)}
    label={
      isSupervisor
        ? (isDaySignedBySupervisor(activeDay) ? 'Ký lại Supervisor' : 'Ký Supervisor')
        : (isDaySignedByOperator(activeDay) ? 'Ký lại Operator' : 'Ký Operator')
    }
    checklistId={checklist.id}
    day={String(activeDay)}
    role={isSupervisor ? 'supervisor' : 'operator'}
  />
</div>
      
{/* Actions */}
{!readOnly && (
  <div className="flex gap-3 mt-4">
    
    {/* Submit cho Operator */}
    {!isSupervisor && checklist.status === 'draft' && (
      <button
        onClick={submit}
        className="btn-primary"
      >
        🚀 Nộp checklist
      </button>
    )}

    {/* Approve cho Supervisor (optional) */}
    {isSupervisor && checklist.status === 'submitted' && (
      <button
        onClick={async () => {
          await fetch(`/api/robot-checklist/${checklist.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'approved',
              supervisor_signatures: supSigs,
            }),
          })
          alert('✅ Đã duyệt checklist')
        }}
        className="btn-success"
      >
        ✅ Duyệt checklist
      </button>
    )}

  </div>
)}
  
      {/* Incidents */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-slate-700">Ghi nhận sự cố máy</h3>
          {!readOnly && (
            <button onClick={addIncident} className="btn-secondary text-xs flex items-center gap-1">
              <Plus className="w-3 h-3" /> Thêm sự cố
            </button>
          )}
        </div>
        {(checklist.incidents || []).length === 0 ? (
          <p className="text-sm text-slate-400 italic">Không có sự cố</p>
        ) : (
          <div className="space-y-2">
            {checklist.incidents.map((inc, idx) => (
              <div key={idx} className="flex gap-2 items-start border rounded-lg p-2 bg-slate-50">
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <input
                    value={inc.incident}
                    onChange={e => updateIncident(idx, 'incident', e.target.value)}
                    placeholder="Mô tả sự cố"
                    disabled={readOnly || isDayLocked(activeDay)}
                    className="input-field text-xs col-span-1"
                  />
                  <input
                    value={inc.date}
                    onChange={e => updateIncident(idx, 'date', e.target.value)}
                    placeholder="Ngày"
                    type="date"
                    disabled={readOnly || isDayLocked(activeDay)}
                    className="input-field text-xs"
                  />
                  <input
                    value={inc.receiver}
                    onChange={e => updateIncident(idx, 'receiver', e.target.value)}
                    placeholder="Người nhận"
                    disabled={readOnly || isDayLocked(activeDay)}
                    className="input-field text-xs"
                  />
                </div>
                {!readOnly && (
                  <button onClick={() => removeIncident(idx)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
