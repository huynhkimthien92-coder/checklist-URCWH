'use client'
import { useState, useCallback } from 'react'
import { CheckItem, Checklist, CheckStatus, Signature } from '@/types'
import { DAY_LABELS, DAY_SHORT, DAYS } from '@/lib/checklist-data'
import { cn } from '@/lib/utils'
import { SignaturePad } from '@/components/forms/SignaturePad'
import { ImageUploader } from '@/components/forms/ImageUploader'
import { Save, Send, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface ChecklistFormProps {
  checklist: Checklist
  readOnly?: boolean
  isSupervisor?: boolean
}

export function ChecklistForm({ checklist, readOnly = false, isSupervisor = false }: ChecklistFormProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<CheckItem[]>(checklist.items)
  const [opSigs, setOpSigs] = useState(checklist.operator_signatures || {})
  const [supSigs, setSupSigs] = useState(checklist.supervisor_signatures || {})
  const [notes, setNotes] = useState(checklist.notes || '')
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeDay, setActiveDay] = useState<string>(DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1])

  const user = session?.user as any
  const isOp = !isSupervisor
  
  const hasCheckedData = (day: string) => {
    return items.some(item => {
      const st = item.days[day]?.status
      return st === 'pass' || st === 'fail'
    })
  }

  const isMissingSupervisorSig = (day: string) => {
    const hasData = items.some(item => {
      const st = item.days[day]?.status
      return st === 'pass' || st === 'fail'
    })

    const hasSig = !!supSigs[day]?.data_url

    return hasData && !hasSig
  }

  const updateStatus = useCallback((itemId: string, day: string, status: CheckStatus) => {
    setItems(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, days: { ...item.days, [day]: { ...item.days[day], status } } }
        : item
    ))
  }, [])

  const updateDetail = useCallback((itemId: string, day: string, detail: string) => {
    setItems(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, days: { ...item.days, [day]: { ...item.days[day], detail } } }
        : item
    ))
  }, [])

  const updateImage = useCallback((itemId: string, day: string, url: string) => {
    setItems(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, days: { ...item.days, [day]: { ...item.days[day], image_url: url } } }
        : item
    ))
  }, [])

  const signDay = async (day: string, dataUrl: string, isSuper: boolean) => {
    const sig: Signature = {
      data_url: dataUrl,
      signed_at: new Date().toISOString(),
      user_id: user?.id,
      user_name: user?.name,
    }
    if (isSuper) setSupSigs(prev => ({ ...prev, [day]: sig }))
    else setOpSigs(prev => ({ ...prev, [day]: sig }))
  }
  // Kiểm tra ngày nào đã được operator ký
  const isDaySignedByOperator = (day: string): boolean => {
    return !!opSigs[day]?.data_url
  }
  // Kiểm tra ngày nào đã được supervisor ký
  const isDaySignedBySupervisor = (day: string): boolean => {
    return !!supSigs[day]?.data_url
  }
  const canEdit = () => {
    if (readOnly) return false
    return checklist.status === 'draft'
  }
  const isDisabled = !canEdit()

 /**
 * Rules:
 * - Operator: ký được nếu checklist ở trạng thái 'draft' hoặc 'submitted'
 * - Supervisor: ký được nếu checklist ở trạng thái 'submitted'& 'draft'
 * - Có thể ký lại (re-sign) ngay cả khi đã ký rồi
 */
  const canSignDay = (day: string, isSuper: boolean): boolean => {
    if (readOnly) return false
      if (isSuper) {
        return checklist.status === 'submitted' || checklist.status === 'draft'
      }
    // operator
    return checklist.status === 'draft'
  }
  
  /**
   * ✅ Trạng thái badge cho signature
   */
  const getSignatureBadgeColor = (day: string, isSuper: boolean): string => {
  if (isSuper && isDaySignedBySupervisor(day)) {
    return 'bg-green-100 text-green-700 border-green-300'
  }
  if (!isSuper && isDaySignedByOperator(day)) {
    return 'bg-blue-100 text-blue-700 border-blue-300'
  }
  return ''
}
  
const alreadySigned = isSupervisor
  ? isDaySignedBySupervisor(activeDay)
  : isDaySignedByOperator(activeDay)

const isDayLocked = (day: string) => {
  return isDaySignedByOperator(day)
}



  const save = async (status?: string) => {
    setSaving(true)
    try {
      const payload = {
        items,
        operator_signatures: opSigs,
        supervisor_signatures: supSigs,
        notes,
        ...(status ? { status } : {}),
      }
      await fetch(`/api/checklists/${checklist.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      if (status) router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const submit = async () => {
    setSubmitting(true)
    await save('submitted')
    setSubmitting(false)
    router.push('/checklist')
  }

  const approve = async () => {
  const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

  const allDaysSigned = DAYS.every(day => {
    if (!hasCheckedData(day)) return true
    return !!supSigs[day]?.data_url
  })

  if (!allDaysSigned) {
    const unsigned = DAYS.filter(day =>
      hasCheckedData(day) && !supSigs[day]?.data_url
    )

    alert(`⚠️ Vui lòng ký xác nhận cho các ngày: ${unsigned.join(', ')}`)
    return
  }

  await save('approved')
  router.push('/supervisor')
  router.refresh()
}

  // Stats for active day
  const passCount = items.filter(i => i.days[activeDay]?.status === 'pass').length
  const failCount = items.filter(i => i.days[activeDay]?.status === 'fail').length
  const totalCount = items.length

  const obsItems = items.filter(i => i.category === 'observation')
  const opItems  = items.filter(i => i.category === 'operation')

  return (
    <div className="space-y-5">
      {/* Day tabs */}
      <div className="card p-1">
        <div className="flex gap-0.5 overflow-x-auto">
          {DAYS.map(day => {

            const dayPass = items.filter(i => i.days[day]?.status === 'pass').length
            const dayFail = items.filter(i => i.days[day]?.status === 'fail').length
            const isActive = activeDay === day

            const hasWarning = isMissingSupervisorSig(day)

            return (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={cn(
                  'relative flex-1 min-w-[60px] flex flex-col items-center py-2 px-2 rounded-lg text-xs font-medium transition-all',
                  isActive
                    ? 'bg-blue-600 text-white shadow'
                    : hasWarning
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                <span className="font-semibold">{DAY_SHORT[day]}</span>

                {(dayPass > 0 || dayFail > 0) && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {dayPass > 0 && <span className={cn('text-[10px]', isActive ? 'text-green-200' : 'text-green-600')}>✓{dayPass}</span>}
                    {dayFail > 0 && <span className={cn('text-[10px]', isActive ? 'text-red-200' : 'text-red-500')}>✗{dayFail}</span>}
                  </div>
                )}

                {/* ✅ BADGE WARNING */}
                {hasWarning && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
                )}

              </button>
            )
          })}
          
        </div>
      </div>

      {/* Day summary bar */}
      <div className="flex items-center gap-4 card px-4 py-3">
        <span className="text-sm font-semibold text-slate-800">{DAY_LABELS[activeDay]}</span>
        <div className="flex items-center gap-1.5 text-sm">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span className="text-green-700 font-medium">{passCount}</span>
          <span className="text-slate-400">đạt</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-red-600 font-medium">{failCount}</span>
          <span className="text-slate-400">không đạt</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm ml-auto">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-slate-500">{totalCount - passCount - failCount} chưa kiểm tra</span>
        </div>
      </div>

      {isDayLocked(activeDay) && (
        <div className="text-xs text-red-500">
          🔒 Ngày đã được ký bởi{' '}
          <span className="font-semibold">
            {opSigs?.[activeDay]?.user_name || 'operator'}
          </span>{' '}
          - không thể chỉnh sửa
        </div>
      )}

      {/* Items table */}
      {[
        { label: 'KIỂM TRA QUAN SÁT', labelEn: 'OBSERVATION CHECK', items: obsItems, color: 'bg-blue-600' },
        { label: 'KIỂM TRA VẬN HÀNH', labelEn: 'OPERATION CHECK', items: opItems, color: 'bg-teal-600' }
      ].map(group => (
        <div key={group.label} className="card overflow-hidden">
          <div className={cn('px-4 py-2.5 flex items-center gap-2', group.color)}>
            <h3 className="text-white font-semibold text-sm">{group.label}</h3>
            <span className="text-white/70 text-xs">— {group.labelEn}</span>
          </div>
          <div className="divide-y divide-slate-100">
            {group.items.map((item, idx) => {
              const entry = item.days[activeDay] || { status: '', detail: '', image_url: '' }
              return (
                <div key={item.id} className={cn(
                  'p-4',
                  entry.status === 'fail' ? 'bg-red-50/60' : ''
                )}>
                  <div className="flex flex-col gap-3">
                    {/* Item header */}
                    <div className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold flex items-center justify-center mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 leading-snug">{item.sub_label}</p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.label_en} - {item.label_vi}</p>
                      </div>
                    </div>

                    {/* Status + Detail row */}
                    <div className="flex items-start gap-2 pl-8">
                      {/* P / X buttons */}
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          disabled={isDisabled || isDayLocked(activeDay)}
                          onClick={() => updateStatus(item.id, activeDay, entry.status === 'pass' ? '' : 'pass')}
                          className={cn(
                            'w-10 h-10 rounded-lg font-bold text-base border-2 transition-all',
                            entry.status === 'pass'
                              ? 'bg-green-600 border-green-600 text-white shadow'
                              : 'bg-white border-slate-200 text-slate-400 hover:border-green-400 hover:text-green-600 disabled:opacity-50'
                          )}
                        >✓</button>
                        <button
                          disabled={isDisabled || isDayLocked(activeDay)}
                          onClick={() => updateStatus(item.id, activeDay, entry.status === 'fail' ? '' : 'fail')}
                          className={cn(
                            'w-10 h-10 rounded-lg font-bold text-base border-2 transition-all',
                            entry.status === 'fail'
                              ? 'bg-red-600 border-red-600 text-white shadow'
                              : 'bg-white border-slate-200 text-slate-400 hover:border-red-400 hover:text-red-600 disabled:opacity-50'
                          )}
                        >X</button>
                      </div>

                      {/* Detail input + image */}
                      <div className="flex-1 flex items-start gap-2">
                        <textarea
                          disabled={isDisabled || isDayLocked(activeDay)}
                          value={entry.detail}
                          onChange={e => updateDetail(item.id, activeDay, e.target.value)}
                          placeholder={entry.status === 'fail' ? 'Mô tả sự cố cụ thể...' : 'Chi tiết (tùy chọn)'}
                          rows={entry.detail ? 2 : 1}
                          className={cn(
                            'flex-1 text-xs resize-none rounded-lg border px-2.5 py-1.5 transition-colors focus:outline-none focus:ring-1',
                            entry.status === 'fail'
                              ? 'border-red-200 bg-red-50 focus:ring-red-400 focus:border-red-400 placeholder-red-300'
                              : 'border-slate-200 bg-slate-50 focus:ring-blue-400 focus:border-blue-400 placeholder-slate-400',
                            isDisabled ? 'opacity-60 cursor-not-allowed' : ''
                          )}
                        />
                        {!isDisabled && (
                          <ImageUploader
                            value={entry.image_url}
                            onChange={url => updateImage(item.id, activeDay, url)}
                            disabled={isDisabled || isDayLocked(activeDay)}
                            checklistId={checklist.id}
                            itemId={item.id}
                            day={activeDay}
                          />
                        )}
                        {isDisabled && entry.image_url && (
                          <a href={entry.image_url} target="_blank" rel="noopener noreferrer">
                            <img src={entry.image_url} alt="ảnh" className="w-14 h-14 object-cover rounded-lg border border-slate-200" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Signature section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-slate-700">
            {isSupervisor ? '🔏 Ký xác nhận Supervisor' : '✍️ Ký xác nhận Tài xế'}
          </label>
          {alreadySigned && (
            <span
              className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-full border',
                getSignatureBadgeColor(activeDay, isSupervisor)
              )}
            >

             <span className="font-semibold">
               {opSigs?.[activeDay]?.user_name || 'operator'}
             </span>{''}

              ✓ Đã ký
            </span>
          )}

        </div>
        {/* Thông báo trạng thái signature */}
        {isSupervisor && !hasCheckedData(activeDay) && (
          <div className="text-xs text-slate-500">
            ⓘ Chỉ ký khi ngày này có dữ liệu kiểm tra
          </div>
        )}
        {/* Signature Pad Component */}
        <SignaturePad
          onSave={(url) => signDay(activeDay, url, isSupervisor)}
          existingSignature={
            isSupervisor
              ? supSigs[activeDay]?.data_url || null
              : opSigs[activeDay]?.data_url || null
          }
          disabled={!canSignDay(activeDay, isSupervisor)}
          label={
            alreadySigned
              ? (isSupervisor ? "Ký lại Supervisor" : "Ký lại Tài xế")
              : (isSupervisor ? "Ký Supervisor" : "Ký Tài xế")
          }
          checklistId={checklist.id}
          day={activeDay}
          role={isSupervisor ? "supervisor" : "operator"}
        />
        {/* Hướng dẫn thêm */}
        {!isSupervisor && (
          <p className="text-xs text-slate-500">
            💡 Ký tên để xác nhận đã kiểm tra xong hạng mục này
          </p>
        )}
      </div>
      

      {/* Notes */}
      <div className="card p-4 space-y-2">
        <label className="block text-sm font-semibold text-slate-700">
          Ghi chú chung <span className="font-normal text-slate-400 text-xs">(Các mục cần sửa chữa hay cân chỉnh)</span>
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          disabled={readOnly}
          rows={3}
          placeholder="Ghi chú thêm về các vấn đề cần xử lý..."
          className="input resize-none"
        />
      </div>

      {/* Action buttons */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-3 no-print">
          <button onClick={() => save()} disabled={saving} className="btn-secondary">
            <Save className="w-4 h-4" />
            {saving ? 'Đang lưu...' : saved ? '✓ Đã lưu' : 'Lưu tạm'}
          </button>

          {isOp && checklist.status === 'draft' && (
            <button onClick={submit} disabled={submitting} className="btn-primary">
              <Send className="w-4 h-4" />
              {submitting ? 'Đang nộp...' : 'Nộp báo cáo'}
            </button>
          )}

          {isSupervisor && checklist.status === 'submitted' && (
            <button onClick={approve} className="btn-success">
              <CheckCircle2 className="w-4 h-4" />
              Xác nhận & Duyệt
            </button>
          )}
        </div>
      )}
    </div>
  )
}
