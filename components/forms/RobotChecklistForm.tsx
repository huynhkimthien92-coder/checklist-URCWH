'use client'
// components/forms/RobotChecklistForm.tsx
// Pattern GIỐNG XE NÂNG (checklistForm.tsx):
//   - useState(buildItems) với mỗi item chứa days data nhúng vào
//   - cycleStatus chỉ setItems (local), không PATCH
//   - Chỉ PATCH khi bấm "Lưu tạm" / ký / submit

import { useState, useCallback, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { CheckCircle, XCircle, Minus, Download, Plus, Trash2, Loader2, Save } from 'lucide-react'
import { RobotChecklist, RobotCheckItem, RobotDayEntry, getDaysInMonth } from '@/lib/robot-checklist-data'
import { SignaturePad } from '@/components/forms/SignaturePad'
import { useRouter } from 'next/navigation'

type RichItem = RobotCheckItem & { days: Record<string, RobotDayEntry> }

function normalizeStatus(status: any) {
  return (status || '')
    .toString()
    .trim()
    .toLowerCase()
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
      
      const dayData = (day_entries || {})?.[day] || {}
      const entry =
        dayData?.[item.id] ??
        dayData?.[String(item.id)] ??
        Object.entries(dayData || {}).find(
          ([key]) =>
            key.trim().toLowerCase() === String(item.id).trim().toLowerCase()
        )?.[1]
      
      days[day] = entry ?? {
        status: '',
        note: '',
        image_url: '',
      }
    }

    return { ...item, days }
  })
}

function toDayEntries(items: RichItem[]): RobotChecklist['day_entries'] {
  const result: RobotChecklist['day_entries'] = {}

  items.forEach(item => {
    Object.entries(item.days).forEach(([day, entry]) => {
      // ✅ chỉ lưu khi có data thật
      const s = normalizeStatus(entry?.status)
      if (
        s === 'pass' ||
        s === 'fail' ||
        entry?.note ||
        entry?.image_url
      ) {
        if (!result[day]) result[day] = {}
        result[day][item.id] = entry
      }
    })
  })

  return result
}

interface Props {
  checklist: RobotChecklist
  onUpdate: (updated: RobotChecklist) => void
  readOnly?: boolean
}

export function RobotChecklistForm({ checklist, onUpdate, readOnly }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  



  const [items, setItems] = useState<RichItem[]>([])

  useEffect(() => {
    if (!checklist) return

    const built = buildItems(
      checklist.items || [],
      checklist.day_entries || {},
      checklist.month,
      checklist.year
    )

    setItems(built)
  }, [checklist.day_entries])


  
  const updateNote = (itemId: string, day: number, note: string) => {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item

      const dayStr = String(day)

      return {
        ...item,
        days: {
          ...item.days,
          [dayStr]: {
            ...(item.days[dayStr] ?? { status: '', image_url: '' }),
            note,
          },
        },
      }
    }))

    setDirty(true)
  }

  const uploadImage = async (itemId: string, day: number, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_PRESET!)

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    const { secure_url } = await res.json()

    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item

      const dayStr = String(day)

      return {
        ...item,
        days: {
          ...item.days,
          [dayStr]: {
            ...(item.days[dayStr] ?? { status: '', note: '' }),
            image_url: secure_url,
          },
        },
      }
    }))

    setDirty(true)
  }



  
  const [opSigs,    setOpSigs]    = useState(checklist.operator_signatures   || {})
  const [supSigs,   setSupSigs]   = useState(checklist.supervisor_signatures || {})
  const [incidents, setIncidents] = useState(checklist.incidents || [])
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [dirty,     setDirty]     = useState(false)

  // Sync signatures/incidents chỉ khi server trả data mới (updated_at đổi)
  const lastSigAtRef = useRef<string | null>(null)
  useEffect(() => {
    if (checklist.updated_at === lastSigAtRef.current) return
    lastSigAtRef.current = checklist.updated_at
    setOpSigs(checklist.operator_signatures || {})
    setSupSigs(checklist.supervisor_signatures || {})
    setIncidents(checklist.incidents || [])
  }, [checklist.updated_at])

  const [activeDay, setActiveDay] = useState<number>(() => {
    const e = checklist.day_entries || {}
  
    // Tìm tất cả ngày có dữ liệu pass/fail
    const daysWithData = Object.entries(e)
      .filter(([, dayMap]) =>
        Object.values(dayMap || {}).some((entry: any) => {
          const s = normalizeStatus(entry?.status)
          return s === 'pass' || s === 'fail'
        })
      )
      .map(([day]) => Number(day))
  
    // ✅ Lấy ngày lớn nhất (ngày cuối cùng)
    if (daysWithData.length > 0) {
      return Math.max(...daysWithData)
    }
  
    const today = new Date().getDate()
    const daysInMonth = getDaysInMonth(checklist.month, checklist.year)
    return today <= daysInMonth ? today : 1
  })

  // ✅ Thêm: Đồng bộ activeDay khi dữ liệu thay đổi
  useEffect(() => {
    if (!checklist.day_entries) return
  
    const e = checklist.day_entries
    const daysWithData = Object.entries(e)
      .filter(([, dayMap]) =>
        Object.values(dayMap || {}).some((entry: any) => {
          const s = normalizeStatus(entry?.status)
          return s === 'pass' || s === 'fail'
        })
      )
      .map(([day]) => Number(day))
  
    if (daysWithData.length > 0) {
      const maxDay = Math.max(...daysWithData)
      setActiveDay(maxDay)
    }
  }, [checklist.day_entries])

  const lastActiveSyncRef = useRef<string | null>(null)

  useEffect(() => {
    if (!checklist) return

    const e = checklist.day_entries || {}

    const daysWithData = Object.entries(e)
      .filter(([, dayMap]) =>
        Object.values(dayMap || {}).some(entry => {
          const s = normalizeStatus(entry?.status)
          return s === 'pass' || s === 'fail'
        })
      )
      .map(([day]) => Number(day))
      .sort((a, b) => b - a)

    if (daysWithData.length > 0) {
      setActiveDay(daysWithData[0])
    }
  }, [checklist.day_entries])


  const role         = (session?.user as any)?.role
  const isSupervisor = role === 'supervisor' || role === 'admin'
  const daysCount    = getDaysInMonth(checklist.month, checklist.year)
  const days         = Array.from({ length: daysCount }, (_, i) => i + 1)
  
  const categories = Array.from(
   new Set(items.map(i => i.category))
  )
  const isDaySignedByOperator   = (day: number) => !!opSigs?.[day]?.data_url
  const isDaySignedBySupervisor = (day: number) => !!supSigs?.[day]?.data_url
  const isDayLocked             = (day: number) => isDaySignedByOperator(day)

  const canSignDay = (day: number, isSuper: boolean) => {
    if (readOnly) return false
    if (isSuper) return checklist.status === 'submitted'
    return checklist.status === 'draft'
  }

  // Giống xe nâng updateStatus() — chỉ setItems, KHÔNG PATCH
  const cycleStatus = useCallback((itemId: string, day: number) => {
    if (readOnly) return
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item
      const dayStr  = String(day)
      const raw = item.days[dayStr]?.status || ''
      const current = normalizeStatus(raw)
      const next    = (current === '' ? 'pass' : current === 'pass' ? 'fail' : '') as '' | 'pass' | 'fail'
      return {
        ...item,
        days: {
          ...item.days,
          
          [dayStr]: { 
            ...(item.days[dayStr] ?? { note: '', image_url: '' }), 
            status: next 
          },
        },
      }
    }))
    setDirty(true)
    setSaved(false)
  }, [readOnly])

 const save = async (extraPayload?: Record<string, unknown>) => {
  setSaving(true)
  try {
    const newDayEntries = toDayEntries(items)

    await fetch(`/api/robot-checklist/${checklist.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        day_entries: newDayEntries,
        operator_signatures: opSigs,
        supervisor_signatures: supSigs,
        incidents,
        ...extraPayload,
      }),
    })

    // ✅ update UI NGAY (rất quan trọng)
    onUpdate({
      ...checklist,
      day_entries: newDayEntries,
    })

    //router.refresh()

    setDirty(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)

  } catch {
    alert('❌ Lưu thất bại')
  } finally {
    setSaving(false)
  }
}

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
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supervisor_signatures: next
        }),
      })

    } else {
      const next = { ...opSigs, [day]: sig }
      setOpSigs(next)

      await fetch(`/api/robot-checklist/${checklist.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operator_signatures: next  // ✅ chỉ lưu signature
        }),
      })

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }


  const submit = async () => {
    const de = toDayEntries(items)
    const daysWithData = Object.keys(de).filter(d => Object.values(de[d] || {}).some((e: any) => e.status !== ''))
    if (daysWithData.length === 0) { alert('⚠️ Bạn chưa nhập dữ liệu checklist'); return }
    const unsigned = daysWithData.filter(d => !opSigs?.[Number(d)]?.data_url)
    if (unsigned.length > 0) { alert(`⚠️ Bạn chưa ký các ngày: ${unsigned.join(', ')}`); return }
    await save({ status: 'submitted' })
    alert('✅ Đã nộp checklist')
    onUpdate({ ...checklist, status: 'submitted' })
  }

  const approve = async () => {
    await save({ status: 'approved' })
    alert('✅ Đã duyệt checklist')
    onUpdate({ ...checklist, status: 'approved' })
  }

  const exportPDF = async () => {
    if (dirty) await save()
    const res = await fetch(`/api/robot-checklist/${checklist.id}/pdf`)
    if (!res.ok) return alert('Xuất PDF thất bại')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `robot-checklist-${checklist.robot_number}-${checklist.month}-${checklist.year}.pdf`
    a.click()
  }

  const addIncident    = () => { setIncidents(p => [...p, { incident: '', date: '', receiver: '' }]); setDirty(true) }
  const updateIncident = (idx: number, field: string, value: string) => {
    setIncidents(p => { const n = [...p]; n[idx] = { ...n[idx], [field]: value }; return n }); setDirty(true)
  }
  const removeIncident = (idx: number) => { setIncidents(p => p.filter((_, i) => i !== idx)); setDirty(true) }
  if (items.length === 0) {
   return <div className="p-4 text-sm text-slate-500">Đang tải dữ liệu...</div>
  }
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
          {!readOnly && checklist.status === 'draft' && (
            <button onClick={() => save()} disabled={saving || !dirty} className="btn-secondary flex items-center gap-1.5">
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
          const hasAny = items.some(item =>
            normalizeStatus(item.days[String(d)]?.status) === 'pass' ||
            normalizeStatus(item.days[String(d)]?.status) === 'fail'
          )
          return (
            <button key={d} onClick={() => setActiveDay(d)}
              className={`w-8 h-8 text-xs rounded font-medium transition-colors ${
                activeDay === d ? 'bg-blue-600 text-white'
                  : hasAny ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >{d}</button>
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
              const catItems = items.filter(i => i.category === cat)
              return catItems.map((item, idx) => {
                const status = normalizeStatus(item.days[String(activeDay)]?.status)
                const bg = status === 'pass' ? 'bg-green-50' : status === 'fail' ? 'bg-red-50' : ''
                return (
                  <tr key={item.id} className={`border-t ${bg}`}>
                    <td className="px-3 py-2 text-slate-500 text-xs">{items.indexOf(item) + 1}</td>
                    {idx === 0 && (
                      <td rowSpan={catItems.length} className="px-3 py-2 font-semibold text-xs text-slate-700 bg-slate-50 border-r align-middle">
                        {cat}
                      </td>
                    )}
                    <td className="px-3 py-2 text-slate-700">{item.label_vi}</td>
                    <td className="px-3 py-2 text-center space-y-1">
                      <button
                        onClick={() => cycleStatus(item.id, activeDay)}
                        disabled={readOnly || isDayLocked(activeDay)}
                        className="p-1 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {status === 'pass' && <CheckCircle className="w-6 h-6 text-green-600" />}
                        {status === 'fail' && <XCircle className="w-6 h-6 text-red-600" />}
                        {status === '' && <Minus className="w-6 h-6 text-slate-300" />}
                      </button>
                      <input
                        type="text"
                          placeholder="Ghi chú..."
                          value={item.days[String(activeDay)]?.note || ''}
                          onChange={(e) => updateNote(item.id, activeDay, e.target.value)}
                          className="w-full text-xs border rounded px-1 py-0.5"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                            if (file) uploadImage(item.id, activeDay, file)
                        }}
                        className="text-xs w-full"
                      />
                      {item.days[String(activeDay)]?.image_url && (
                        <img
                        src={item.days[String(activeDay)].image_url}
                        alt="preview"
                        className="w-12 h-12 object-cover rounded border mx-auto"
                        />
                      )}

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
          <p className="text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border">Chỉ ký được khi checklist đã submit</p>
        )}
        <SignaturePad
          onSave={(url) => signDay(activeDay, url, isSupervisor)}
          existingSignature={isSupervisor ? supSigs?.[activeDay]?.data_url || null : opSigs?.[activeDay]?.data_url || null}
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
        <div className="flex gap-3">
          {!isSupervisor && checklist.status === 'draft' && (
            <button onClick={submit} disabled={saving} className="btn-primary">🚀 Nộp checklist</button>
          )}
          {isSupervisor && checklist.status === 'submitted' && (
            <button onClick={approve} disabled={saving} className="btn-success">✅ Duyệt checklist</button>
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
                  <input value={inc.incident} onChange={e => updateIncident(idx, 'incident', e.target.value)} placeholder="Mô tả sự cố" disabled={readOnly} className="input-field text-xs" />
                  <input value={inc.date} onChange={e => updateIncident(idx, 'date', e.target.value)} type="date" disabled={readOnly} className="input-field text-xs" />
                  <input value={inc.receiver} onChange={e => updateIncident(idx, 'receiver', e.target.value)} placeholder="Người nhận" disabled={readOnly} className="input-field text-xs" />
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
