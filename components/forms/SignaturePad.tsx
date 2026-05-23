'use client'

import { useRef, useState } from 'react'
import { RotateCcw, Check, PenLine, Loader2 } from 'lucide-react'

// ================= TYPE =================
interface SignaturePadProps {
  onSave: (url: string) => void | Promise<void>
  existingSignature?: string | null
  label?: string
  disabled?: boolean

  // ✅ OPTIONAL để support 2 mode
  checklistId?: string
  day?: string
  role?: 'operator' | 'supervisor'
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
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [isDrawing, setIsDrawing] = useState(false)
  const [hasContent, setHasContent] = useState(false)
  const [showPad, setShowPad] = useState(autoOpen ?? false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  // ===== save =====
  const save = async () => {
    if (!hasContent) return

    setUploading(true)
    setError(null)

    try {
      const dataUrl = canvasRef.current!.toDataURL('image/png')

      // ✅ build payload (dual mode)
      const payload: any = { dataUrl }

      if (checklistId && day && role) {
        payload.checklistId = checklistId
        payload.day = day
        payload.role = role
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

      setShowPad(false)

    } catch (err) {
      console.error('[SignaturePad] upload error:', err)
      setError('Upload thất bại, vui lòng thử lại.')
    } finally {
      setUploading(false)
    }
  }

  // ===== SHOW EXISTING =====
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
              setShowPad(true)
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
        onClick={() => !disabled && setShowPad(true)}
        disabled={disabled}
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

        {/* BODY */}
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
            <p className="text-xs text-red-500 mt-2 text-center">
              {error}
            </p>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex gap-3 px-5 pb-5">

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
      </div>
    </div>
  )
}
