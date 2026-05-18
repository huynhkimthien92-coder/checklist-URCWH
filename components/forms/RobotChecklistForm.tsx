'use client'
// components/forms/RobotChecklistForm.tsx
//
// FIXES trong version này:
// 1. Bỏ router.refresh() sau save — gây Server Component re-render → props mới
//    nhưng useState trong RobotChecklistClient không reset → UI trắng/lệch
// 2. Bỏ onUpdate(serverData) sau save — server trả về items dạng string JSON
//    → checklist.items.map() crash → màn hình trắng
// 3. Pattern giống xe nâng: local state làm source of truth, save chỉ PATCH DB,
//    không dùng response để override state

import { useState, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { CheckCircle, XCircle, Minus, Download, Plus, Trash2, Loader2, Save } from 'lucide-react'
import { RobotChecklist, getDaysInMonth } from '@/lib/robot-checklist-data'
import { SignaturePad } from '@/components/forms/SignaturePad'
import type { RobotDayEntry } from '@/lib/robot-checklist-data'

interface Props {
  checklist: RobotChecklist
  onUpdate: (updated: RobotChecklist) => void
  readOnly?: boolean
}

export function RobotChecklistForm({ checklist, onUpdate, readOnly }: Props) {
  const { data: session } = useSession()

  // ── Local state — source of truth, KHÔNG bị ghi đè bởi server response ──
  
  const [dayEntries, setDayEntries] = useState<
    Record<string, Record<string, RobotDayEntry>>
  >(checklist.day_entries || {})

  const [opSigs,     setOpSigs]     = useState(checklist.operator_signatures   || {})
  const [supSigs,    setSupSigs]    = useState(checklist.supervisor_signatures || {})
  const [incidents,  setIncidents]  = useState(checklist.incidents || [])

  // dùng ref để cycleStatus luôn đọc đúng state mới nhất (tránh stale closure)
  
  const dayEntriesRef = useRef<
    Record<string, Record<string, RobotDayEntry>>
  >(dayEntries)

  const syncRef = (next: typeof dayEntries) => {
    dayEntriesRef.current = next
    setDayEntries(next)
  }

  // ── UI state ───────────────────────────────────────────────────────────────
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [dirty,     setDirty]     = useState(false)
  const [activeDay, setActiveDay] = useState<number>(new Date().getDate())

  const role         = (session?.user as any)?.role
  const isSupervisor = role === 'supervisor' || role === 'admin'

  const daysCount  = getDaysInMonth(checklist.month, checklist.year)
  const days       = Array.from({ length: daysCount }, (_, i) => i + 1)
  const categories = Array.from(new Set(checklist.items.map(i => i.category)))

  const isDaySignedByOperator   = (day: number) => !!opSigs?.[day]?.data_url
  const isDaySignedBySupervisor = (day: number) => !!supSigs?.[day]?.data_url
  const isDayLocked             = (day: number) => isDaySignedByOperator(day)

  const canSignDay = (day: number, isSuper: boolean) => {
    if (readOnly) return false
    if (isSuper) return checklist.status === 'submitted'
    return checklist.status === 'draft'
  }

  // ── cycleStatus: chỉ update local state, KHÔNG PATCH ─────────────────────
  const cycleStatus = useCallback((itemId: string, day: number) => {
    if (readOnly) return

    // đọc từ ref — không bao giờ stale dù click nhanh
    const current = dayEntriesRef.current?.[String(day)]?.[itemId]?.status || ''
    const next = (current === '' ? 'pass' : current === 'pass' ? 'fail' : '') as '' | 'pass' | 'fail'

    const updated: Record<string, Record<string, import('@/lib/robot-checklist-data').RobotDayEntry>> = {
      ...dayEntriesRef.current,
      [String(day)]: {
        ...dayEntriesRef.current?.[String(day)],
        [itemId]: {
          ...(dayEntriesRef.current?.[String(day)]?.[itemId] ?? {
            note: '',
            image_url: ''
          }),
          status: next,
        } as import('@/lib/robot-checklist-data').RobotDayEntry,
      },
    }

    syncRef(updated)
    setDirty(true)
    setSaved(false)
  }, [readOnly])

  // ── save: PATCH lên DB, KHÔNG dùng response để override state ─────────────
  const save = async (extraPayload?: Record<string, unknown>) => {
    setSaving(true)
    try {
      await fetch(`/api/robot-checklist/${checklist.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          day_entries:           dayEntriesRef.current,
          operator_signatures:   opSigs,
          supervisor_signatures: supSigs,
          incidents,
          ...extraPayload,
        }),
      })
      // ✅ KHÔNG gọi onUpdate(serverData) — tránh items bị parse thành string
      // ✅ KHÔNG gọi router.refresh() — tránh props reset làm trắng trang
      setDirty(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      alert('❌ Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  // ── signDay: lưu chữ ký local rồi PATCH ngay (chữ ký cần persist tức thì) ─
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
      await fetch(`/api/robot-checklist/${checklist.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ supervisor_signatures: next }),
      })
    } else {
      const next = { ...opSigs, [day]: sig }
      setOpSigs(next)
      // lưu kèm day_entries để đảm bảo đồng bộ
      await fetch(`/api/robot-checklist/${checklist.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          operator_signatures: next,
          day_entries: dayEntriesRef.current,
        }),
      })
      setDirty(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  // ── submit ────────────────────────────────────────────────────────────────
  const submit = async () => {
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
    await save({ status: 'submitted' })
    alert('✅ Đã nộp checklist')
    onUpdate({ ...checklist, status: 'submitted' })
  }

  // ── approve ───────────────────────────────────────────────────────────────
  const approve = async () => {
    await save({ status: 'approved' })
    alert('✅ Đã duyệt checklist')
    onUpdate({ ...checklist, status: 'approved' })
  }

  // ── exportPDF ─────────────────────────────────────────────────────────────
  const exportPDF = async () => {
    // lưu trước để PDF có data mới nhất
    if (dirty) await save()
    const res = await fetch(`/api/robot-checklist/${checklist.id}/pdf`)
    if (!res.ok) return alert('Xuất PDF thất bại')
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `robot-checklist-${checklist.robot_number}-${checklist.month}-${checklist.year}.pdf`
    a.click()
  }

  // ── incidents ─────────────────────────────────────────────────────────────
  const addIncident = () => {
    setIncidents(p => [...p, { incident: '', date: '', receiver: '' }])
    setDirty(true)
  }
  const updateIncident = (idx: number, field: string, value: string) => {
    setIncidents(p => {
      const n = [...p]; n[idx] = { ...n[idx], [field]: value }; return n
    })
    setDirty(true)
  }
  const removeIncident = (idx: number) => {
    setIncidents(p => p.filter((_, i) => i !== idx))
    setDirty(true)
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Robot: {checklist.robot_number}</h2>
          <p className="text-sm text-slate-500">Tháng {checklist.month}/{checklist.year} · {checklist.area}</p>
        </div>
        <div className="flex items-center gap-2">
          {saving && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}

          {/* Nút Lưu tạm — giống xe nâng */}
          {!readOnly && checklist.status === 'draft' && (
            <button
              onClick={() => save()}
              disabled={saving || !dirty}
              className="btn-secondary flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Đang lưu...' : saved ? '✓ Đã lưu' : 'Lưu tạm'}
            </button>
          )}

          <button onClick={exportPDF} disabled={saving} className="btn-secondary flex items-center gap-1.5">
            <Download className="w-4 h-4" /> Xuất PDF
          </button>
        </div>
      </div>

      {/* Day selector */}
      <div className="flex gap-1 flex-wrap">
        {days.map(d => {
          const hasAny = checklist.items.some(item => dayEntries?.[String(d)]?.[item.id]?.status)
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

      {/* Checklist table */}
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
                const status = dayEntries?.[String(activeDay)]?.[item.id]?.status || ''
                const bg     = status === 'pass' ? 'bg-green-50' : status === 'fail' ? 'bg-red-50' : ''
                return (
                  <tr key={item.id} className={`border-t ${bg}`}>
                    <td className="px-3 py-2 text-slate-500 text-xs">{checklist.items.indexOf(item) + 1}</td>
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
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-700">
            {isSupervisor ? '🔏 Ký Supervisor' : '✍️ Ký Operator'}
          </label>
          {(isSupervisor ? isDaySignedBySupervisor(activeDay) : isDaySignedByOperator(activeDay)) && (
            <span className="text-xs px-2 py-0.5 rounded-full border bg-green-100 text-green-700">✓ Đã ký</span>
          )}
        </div>
        {isSupervisor && checklist.status !== 'submitted' && (
          <p className="text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border">
            Chỉ ký được khi checklist đã submit
          </p>
        )}
        <SignaturePad
          onSave={(url) => signDay(activeDay, url, isSupervisor)}
          existingSignature={
            isSupervisor ? supSigs?.[activeDay]?.data_url || null : opSigs?.[activeDay]?.data_url || null
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
        <div className="flex gap-3">
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
        {incidents.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Không có sự cố</p>
        ) : (
          <div className="space-y-2">
            {incidents.map((inc, idx) => (
              <div key={idx} className="flex gap-2 items-start border rounded-lg p-2 bg-slate-50">
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <input value={inc.incident} onChange={e => updateIncident(idx, 'incident', e.target.value)}
                    placeholder="Mô tả sự cố" disabled={readOnly} className="input-field text-xs" />
                  <input value={inc.date} onChange={e => updateIncident(idx, 'date', e.target.value)}
                    type="date" disabled={readOnly} className="input-field text-xs" />
                  <input value={inc.receiver} onChange={e => updateIncident(idx, 'receiver', e.target.value)}
                    placeholder="Người nhận" disabled={readOnly} className="input-field text-xs" />
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
