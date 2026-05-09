'use client'
import { useRef, useState, useEffect } from 'react'
import { RotateCcw, Check, PenLine } from 'lucide-react'

interface SignaturePadProps {
  onSave: (dataUrl: string) => void
  existingSignature?: string | null
  label?: string
  disabled?: boolean
}

export function SignaturePad({ onSave, existingSignature, label = 'Ký tên', disabled }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasContent, setHasContent] = useState(false)
  const [showPad, setShowPad] = useState(false)

  const getCtx = () => canvasRef.current?.getContext('2d')

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return
    setIsDrawing(true)
    const canvas = canvasRef.current!
    const ctx = getCtx()!
    const rect = canvas.getBoundingClientRect()
    const { clientX, clientY } = 'touches' in e ? e.touches[0] : e
    ctx.beginPath()
    ctx.moveTo(clientX - rect.left, clientY - rect.top)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return
    e.preventDefault()
    const canvas = canvasRef.current!
    const ctx = getCtx()!
    const rect = canvas.getBoundingClientRect()
    const { clientX, clientY } = 'touches' in e ? e.touches[0] : e
    ctx.lineTo(clientX - rect.left, clientY - rect.top)
    ctx.strokeStyle = '#1e40af'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    setHasContent(true)
  }

  const endDraw = () => setIsDrawing(false)

  const clear = () => {
    const canvas = canvasRef.current!
    const ctx = getCtx()!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasContent(false)
  }

  const save = () => {
    const dataUrl = canvasRef.current!.toDataURL()
    onSave(dataUrl)
    setShowPad(false)
  }

  if (existingSignature) {
    return (
      <div className="flex flex-col items-center gap-1">
        <img src={existingSignature} alt="Chữ ký" className="h-12 w-auto border-b border-slate-300" />
        {!disabled && (
          <button onClick={() => { onSave(''); setShowPad(true) }}
            className="text-xs text-blue-600 hover:underline">
            Ký lại
          </button>
        )}
      </div>
    )
  }

  if (!showPad) {
    return (
      <button
        onClick={() => !disabled && setShowPad(true)}
        disabled={disabled}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-slate-300 rounded-lg text-xs text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <PenLine className="w-3.5 h-3.5" />
        {label}
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold text-slate-800">{label}</h3>
          <button onClick={() => setShowPad(false)} className="text-slate-400 hover:text-slate-600 text-sm">Huỷ</button>
        </div>
        <div className="p-4">
          <p className="text-xs text-slate-400 text-center mb-2">Ký tên vào ô bên dưới</p>
          <canvas
            ref={canvasRef}
            width={380}
            height={160}
            className="sig-canvas w-full border-2 border-dashed border-slate-300 rounded-xl bg-blue-50/30"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
        </div>
        <div className="flex items-center gap-3 px-5 pb-5">
          <button onClick={clear} className="btn-secondary flex-1 justify-center">
            <RotateCcw className="w-4 h-4" /> Xoá
          </button>
          <button
            onClick={save}
            disabled={!hasContent}
            className="btn-primary flex-1 justify-center"
          >
            <Check className="w-4 h-4" /> Xác nhận
          </button>
        </div>
      </div>
    </div>
  )
}
