'use client'
// components/forms/RobotChecklistForm.tsx
//
// ROOT CAUSE FIX: stale closure race condition
// ─────────────────────────────────────────────
// Vấn đề gốc: cycleStatus dùng `checklist` prop (từ closure) để build `updated`.
// Khi click nhanh nhiều item trong 1 ngày:
//   click A  → đọc checklist cũ  → build updatedA → PATCH A (gửi lên DB)
//   click B  → đọc checklist cũ  → build updatedB (KHÔNG có change của A) → PATCH B ghi đè A
// Kết quả: refresh mất data của A.
//
// Fix: dùng `dayEntriesRef` (useRef) làm source of truth tuyệt đối.
// Mọi thay đổi ghi vào ref TRƯỚC KHI PATCH → PATCH luôn dùng data mới nhất.
// useRef không gây re-render nên không ảnh hưởng performance.

import { useState, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { CheckCircle, XCircle, Minus, Download, Plus, Trash2, Loader2 } from 'lucide-react'
import { RobotChecklist, RobotCheckItem, getDaysInMonth } from '@/lib/robot-checklist-data'
import { SignaturePad } from '@/components/forms/SignaturePad'
import { useEffect } from 'react'

interface Props {
  checklist: RobotChecklist
  onUpdate: (updated: RobotChecklist) => void
  readOnly?: boolean
}

export function RobotChecklistForm({ checklist, onUpdate, readOnly }: Props) {
  const { data: session } = useSession()

  // ── Signatures ──────────────────────────────────────────────────────────
  const [opSigs,  setOpSigs]  = useState(checklist.operator_signatures   || {})
  const [supSigs, setSupSigs] = useState(checklist.supervisor_signatures || {})

  // ── UI state ─────────────────────────────────────────────────────────────
  const [saving,    setSaving]    = useState(false)
  const [activeDay, setActiveDay] = useState<number>(new Date().getDate())

  // ── SOURCE OF TRUTH cho day_entries ──────────────────────────────────────
  // useRef: không gây re-render, không bị stale closure.
  // Mọi click cycleStatus ghi vào đây TRƯỚC khi PATCH → PATCH luôn đúng.
  const dayEntriesRef = useRef<RobotChecklist['day_entries']>(
    checklist.day_entries || {}
  )

  // Local display state — chỉ dùng để trigger re-render cho UI
  const [displayEntries, setDisplayEntries] = useState<RobotChecklist['day_entries']>(
    checklist.day_entries || {}
  )

  useEffect(() => {
    if (!checklist.day_entries) return

    // ✅ chỉ sync khi ref đang empty (lúc load lần đầu)
    if (Object.keys(dayEntriesRef.current || {}).length === 0) {
      dayEntriesRef.current = checklist.day_entries
      setDisplayEntries(checklist.day_entries)
    }
  }, [checklist.id])


  // ── Helpers ───────────────────────────────────────────────────────────────
  const role         = (session?.user as any)?.role
  const isSupervisor = role === 'supervisor' || role === 'admin'

  const isDaySignedByOperator   = (day: number) => !!opSigs?.[day]?.data_url
  const isDaySignedBySupervisor = (day: number) => !!supSigs?.[day]?.data_url
  const isDayLocked             = (day: number) => isDaySignedByOperator(day)

  const canSignDay = (day: number, isSuper: boolean) => {
    if (readOnly) return false
    if (isSuper) return checklist.status === 'submitted'
    return checklist.status === 'draft'
  }

  const daysCount = getDaysInMonth(checklist.month, checklist.year)
  const days      = Array.from({ length: daysCount }, (_, i) => i + 1)
  const categories = Array.from(new Set(checklist.items.map(i => i.category)))

  // ── cycleStatus — FIX CHÍNH ───────────────────────────────────────────────
  const cycleStatus = useCallback(async (itemId: string, day: number) => {
    if (readOnly) return

    // 1. Đọc từ ref (luôn mới nhất, không bao giờ stale)
    const current = dayEntriesRef.current?.[String(day)]?.[itemId]?.status || ''
    const next    = current === '' ? 'pass' : current === 'pass' ? 'fail' : ''

    // 2. Ghi vào ref NGAY LẬP TỨC (đồng bộ, trước khi async)
    
    const existing =
      dayEntriesRef.current?.[String(day)]?.[itemId] || {
      status: '',
      note: '',
      image_url: '',
      }

    dayEntriesRef.current = {
      ...dayEntriesRef.current,
      [String(day)]: {
        ...dayEntriesRef.current?.[String(day)],
        [itemId]: {
          ...existing,
          status: next,
        },
      },
    }

    // 3. Cập nhật display state để UI re-render
    setDisplayEntries({ ...dayEntriesRef.current })

    // 4. Notify parent
    onUpdate({ ...checklist, day_entries: dayEntriesRef.current })

  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checklist.id, readOnly, onUpdate])
  // NOTE: không đưa `checklist` vào deps — đây là chủ ý để tránh stale closure.
  // dayEntriesRef.current luôn là source of truth thay thế.

  // ── signDay ───────────────────────────────────────────────────────────────
  const signDay = async (day: number, dataUrl: string, isSuper: boolean) => {
    const sig = {
      data_url:  dataUrl,
      signed_at: new Date().toISOString(),
      user_id:   (session?.user as any)?.id,
      user_name: (session?.user as any)?.name,
    }

    if (isSuper) {
      const next = { ...supSigs, [day]: sig }
      setSupSigs(next)
      onUpdate({ ...checklist, day_entries: dayEntriesRef.current, supervisor_signatures: next })
      await fetch(`/api/robot-checklist/${checklist.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ supervisor_signatures: next }),
      })
    } else {
      const next = { ...opSigs, [day]: sig }
      setOpSigs(next)
      onUpdate({ ...checklist, day_entries: dayEntriesRef.current, operator_signatures: next })
      await fetch(`/api/robot-checklist/${checklist.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ operator_signatures: next }),
      })
    }
  }
  const save = async () => {
    setSaving(true)
    try {
      await fetch(`/api/robot-checklist/${checklist.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day_entries: dayEntriesRef.current,
          operator_signatures: opSigs,
          supervisor_signatures: supSigs,
        }),
      })
      alert('✅ Đã lưu checklist')
    } catch (err) {
      alert('❌ Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }


  // ── Incidents ─────────────────────────────────────────────────────────────
  const addIncident = () => {
    onUpdate({
      ...checklist,
      day_entries: dayEntriesRef.current,
      incidents: [...(checklist.incidents || []), { incident: '', date: '', receiver: '' }],
    })
  }

  const updateIncident = async (idx: number, field: string, value: string) => {
    const incidents = [...(checklist.incidents || [])]
    incidents[idx]  = { ...incidents[idx], [field]: value }
    onUpdate({ ...checklist, day_entries: dayEntriesRef.current, incidents })
    await fetch(`/api/robot-checklist/${checklist.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ incidents }),
    })
  }

  const removeIncident = async (idx: number) => {
    const incidents = checklist.incidents.filter((_, i) => i !== idx)
    onUpdate({ ...checklist, day_entries: dayEntriesRef.current, incidents })
    await fetch(`/api/robot-checklist/${checklist.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ incidents }),
    })
  }

  // ── Submit / Approve ──────────────────────────────────────────────────────
  const submit = async () => {
    // Chỉ tính ngày có ít nhất 1 item được check (status !== '')
    const daysWithData = Object.keys(dayEntriesRef.current).filter(day =>
      Object.values(dayEntriesRef.current[day] || {}).some((e: any) => e.status !== '')
    )

    if (daysWithData.length === 0) {
      alert('⚠️ Bạn chưa nhập dữ liệu checklist')
      return
    }

    const unsignedDays = daysWithData.filter(day => !opSigs?.[Number(day)]?.data_url)
    if (unsignedDays.length > 0) {
      alert(`⚠️ Bạn chưa ký các ngày: ${unsignedDays.join(', ')}`)
      return
    }

    setSaving(true)
    try {
      await fetch(`/api/robot-checklist/${checklist.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          status:               'submitted',
          operator_signatures:  opSigs,
          day_entries:          dayEntriesRef.current, // ✅ lưu lại lần cuối khi submit
        }),
      })
      alert('✅ Đã nộp checklist')
    } finally {
      setSaving(false)
    }
  }

  const approve = async () => {
    setSaving(true)
    try {
      await fetch(`/api/robot-checklist/${checklist.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          status:                  'approved',
          supervisor_signatures:   supSigs,
        }),
      })
      alert('✅ Đã duyệt checklist')
    } finally {
      setSaving(false)
    }
  }

  // ── Export PDF ────────────────────────────────────────────────────────────
  const exportPDF = async () => {
    const res = await fetch(`/api/robot-checklist/${checklist.id}/pdf`)
    if (!res.ok) return alert('Xuất PDF thất bại')
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `robot-checklist-${checklist.robot_number}-${checklist.month}-${checklist.year}.pdf`
    a.click()
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
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

      {/* Day selector — dùng displayEntries để check hasAny */}
      <div className="flex gap-1 flex-wrap">
        {days.map(d => {
          const hasAny = checklist.items.some(item =>
            displayEntries?.[String(d)]?.[item.id]?.status
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

      {/* Checklist table — dùng displayEntries để render status */}
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
                const entry  = displayEntries?.[String(activeDay)]?.[item.id]
                const status = entry?.status || ''
                const bg     = status === 'pass' ? 'bg-green-50' : status === 'fail' ? 'bg-red-50' : ''
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
                        className="p-1 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {status === 'pass' && <CheckCircle className="w-6 h-6 text-green-600" />}
                        {status === 'fail' && <XCircle    className="w-6 h-6 text-red-600"   />}
                        {status === ''    && <Minus       className="w-6 h-6 text-slate-300" />}
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
          {(isSupervisor ? isDaySignedBySupervisor(activeDay) : isDaySignedByOperator(activeDay)) && (
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
              : opSigs?.[activeDay]?.data_url  || null
          }
          disabled={!canSignDay(activeDay, isSupervisor)}
          label={
            isSupervisor
              ? (isDaySignedBySupervisor(activeDay) ? 'Ký lại Supervisor' : 'Ký Supervisor')
              : (isDaySignedByOperator(activeDay)   ? 'Ký lại Operator'   : 'Ký Operator')
          }
          checklistId={checklist.id}
          day={String(activeDay)}
          role={isSupervisor ? 'supervisor' : 'operator'}
        />
      </div>

      {/* Actions */}
      {!readOnly && (
        <div className="flex gap-3 mt-4">
          {/* ✅ NEW */}
          <button onClick={save} disabled={saving} className="btn-secondary">
            💾 Lưu tạm
          </button>

          {!isSupervisor && checklist.status === 'draft' && (
            <button onClick={submit} disabled={saving} className="btn-primary">
              🚀 Nộp checklist
            </button>
          )}
          {isSupervisor && checklist.status === 'submitted' && (
            <button onClick={approve} disabled={saving} className="btn-success">
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
