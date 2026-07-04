'use client'

import { useEffect, useRef, useState } from 'react'
import { RotateCcw, Check, PenLine, Loader2, BadgeCheck } from 'lucide-react'

// ================= TYPE =================
interface SignaturePadProps {
  onSave: (url: string) => void | Promise<void>
  existingSignature?: string | null
  label?: string
  disabled?: boolean
  autoOpen?: boolean

  // ✅ OPTIONAL để support mode ký checklist
  checklistId?: string
  day?: string
  role?: 'operator' | 'supervisor'

  // ✅ true = đây là màn "Khai báo chữ ký cá nhân" (ghi vào hồ sơ user)
  saveAsProfile?: boolean

  // ✅ false = luôn bắt vẽ tay, không cho chọn "dùng chữ ký đã lưu"
  //    (mặc định true; ví dụ Truck Exit - driver phải luôn tự vẽ)
  allowUseSavedSignature?: boolean
}

// ================= COMPONENT =================
export function SignaturePad({
  onSave,
  existingSignature,
  label = 'Ký tên',
  disabled,
  checklistId,
  day,
  role,
  autoOpen,
  saveAsProfile = false,
  allowUseSavedSignature = true,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [isDrawing, setIsDrawing] = useState(false)
  const [hasContent, setHasContent] = useState(false)
  const [showPad, setShowPad] = useState(autoOpen ?? false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 'choose'  = màn chọn "dùng chữ ký đã lưu" hay "vẽ mới"
  // 'draw'    = màn canvas vẽ tay
  const [step, setStep] = useState<'choose' | 'draw'>('draw')

  // Chữ ký cá nhân đã khai báo (nếu có) — dùng để gợi ý tái sử dụng
  const [savedSignature, setSavedSignature] = useState<string | null>(null)
  const [loadingSaved, setLoadingSaved] = useState(false)

  const canOfferSaved = allowUseSavedSignature && !saveAsProfile

  // ✅ Tải trước chữ ký đã khai báo (nếu được phép dùng) để quyết định hiện màn "choose"
  useEffect(() => {
    if (!canOfferSaved) return

    let cancelled = false
    setLoadingSaved(true)

    fetch('/api/user-signature')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!cancelled) setSavedSignature(data?.url || null)
      })
      .catch(() => {
        if (!cancelled) setSavedSignature(null)
      })
      .finally(() => {
        if (!cancelled) setLoadingSaved(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canOfferSaved])

  // ===== helpers =====
  const getCtx = () => canvasRef.current?.getContext('2d')

  const getPos = (e: any) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const point = e.touches ? e.touches[0] : e

    return {
      x: point.clientX - rect.left,
      y: point.clientY - rect.top,
    }
  }

  // ===== drawing =====
  const startDraw = (e: any) => {
    if (disabled) return
    setIsDrawing(true)

    const ctx = getCtx()
    if (!ctx) return

    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: any) => {
    if (!isDrawing || disabled) return

    e.preventDefault()

    const ctx = getCtx()
    if (!ctx) return

    const { x, y } = getPos(e)

    ctx.lineTo(x, y)
    ctx.strokeStyle = '#1e40af'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()

    setHasContent(true)
  }

  const endDraw = () => setIsDrawing(false)

  // ===== clear =====
  const clear = () => {
    const canvas = canvasRef.current!
    const ctx = getCtx()
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasContent(false)
    setError(null)
  }

  // ===== open pad =====
  const openPad = () => {
    if (disabled) return

    // Nếu có chữ ký đã khai báo và được phép dùng → hỏi trước, ngược lại vẽ luôn
    setStep(canOfferSaved && savedSignature ? 'choose' : 'draw')
    setShowPad(true)
  }

  // ===== dùng chữ ký đã khai báo =====
  const useSaved = async () => {
    if (!savedSignature) return

    try {
      setUploading(true)
      await onSave(savedSignature)
      setShowPad(false)
    } finally {
      setUploading(false)
    }
  }

  // ===== save (vẽ tay) =====
  const save = async () => {
    if (!hasContent) return

    setUploading(true)
    setError(null)

    try {
      const dataUrl = canvasRef.current!.toDataURL('image/png')

      const payload: any = { dataUrl }

      if (checklistId && day && role) {
        payload.checklistId = checklistId
        payload.day = day
        payload.role = role
      } else if (saveAsProfile) {
        payload.saveAsProfile = true
      }

      const res = await fetch('/api/upload-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text)
      }

      const data = await res.json()

      await onSave(data.url)

      // Nếu vừa vẽ tay và đây không phải màn khai báo hồ sơ,
      // cập nhật cache local phòng khi mở lại pad trong cùng phiên.
      if (!saveAsProfile) setSavedSignature(prev => prev)

      setShowPad(false)
    } catch (err) {
      console.error('[SignaturePad] upload error:', err)
      setError('Upload thất bại, vui lòng thử lại.')
    } finally {
      setUploading(false)
    }
  }

  // ===== SHOW EXISTING (đã ký ngày/vai trò này rồi) =====
  if (existingSignature) {
    return (
      <div className="flex flex-col items-center gap-1">
        <img
          src={existingSignature}
          alt="Chữ ký"
          className="h-12 border-b border-slate-300"
        />

        {!disabled && (
          <button
            onClick={() => {
              onSave('')
              openPad()
            }}
            className="text-xs text-blue-600 hover:underline"
          >
            Ký lại
          </button>
        )}
      </div>
    )
  }

  // ===== BUTTON OPEN =====
  if (!showPad) {
    return (
      <button
        onClick={openPad}
        disabled={disabled || loadingSaved}
        className="flex items-center gap-1.5 px-3 py-1.5
        border border-dashed border-slate-300 rounded-lg text-xs
        text-slate-500 hover:border-blue-400 hover:text-blue-600
        disabled:opacity-50"
      >
        <PenLine className="w-3.5 h-3.5" />
        {label}
      </button>
    )
  }

  // ===== MODAL =====
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* HEADER */}
        <div className="flex justify-between items-center px-5 py-4 border-b">
          <h3 className="font-semibold text-slate-800">{label}</h3>

          <button
            onClick={() => setShowPad(false)}
            disabled={uploading}
            className="text-slate-400 hover:text-slate-600"
          >
            Huỷ
          </button>
        </div>

        {step === 'choose' ? (
          // ===== BODY: CHỌN DÙNG CHỮ KÝ ĐÃ LƯU HAY VẼ MỚI =====
          <div className="p-5">
            <p className="text-xs text-slate-400 text-center mb-3">
              Bạn đã khai báo chữ ký cá nhân. Chọn cách ký:
            </p>

            <div className="border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex items-center justify-center py-4 mb-4">
              <img src={savedSignature!} alt="Chữ ký đã khai báo" className="h-14" />
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={useSaved}
                disabled={uploading}
                className="btn-primary justify-center"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <BadgeCheck className="w-4 h-4" />
                    Dùng chữ ký đã lưu
                  </>
                )}
              </button>

              <button
                onClick={() => setStep('draw')}
                disabled={uploading}
                className="btn-secondary justify-center"
              >
                <PenLine className="w-4 h-4" />
                Vẽ chữ ký mới
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* BODY: VẼ TAY */}
            <div className="p-4">
              <p className="text-xs text-slate-400 text-center mb-2">
                Ký vào vùng bên dưới
              </p>

              <canvas
                ref={canvasRef}
                width={380}
                height={160}
                className="w-full border-2 border-dashed border-slate-300 rounded-xl bg-blue-50/30 touch-none"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
              />

              {error && (
                <p className="text-xs text-red-500 mt-2 text-center">{error}</p>
              )}
            </div>

            {/* FOOTER */}
            <div className="flex gap-3 px-5 pb-5">
              {canOfferSaved && savedSignature && (
                <button
                  onClick={() => setStep('choose')}
                  disabled={uploading}
                  className="btn-secondary"
                  title="Quay lại chọn chữ ký đã lưu"
                >
                  ←
                </button>
              )}

              <button
                onClick={clear}
                disabled={uploading}
                className="btn-secondary flex-1 justify-center"
              >
                <RotateCcw className="w-4 h-4" />
                Xoá
              </button>

              <button
                onClick={save}
                disabled={!hasContent || uploading}
                className="btn-primary flex-1 justify-center"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Xác nhận
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
