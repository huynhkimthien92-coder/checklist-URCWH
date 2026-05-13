'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { X, Camera, Loader2, AlertCircle } from 'lucide-react'

interface QRScannerProps {
  onScan: (value: string) => void
  onClose: () => void
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [jsQR, setJsQR] = useState<any>(null)

  // Dynamically load jsQR
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js'
    script.onload = () => {
      setJsQR(() => (window as any).jsQR)
    }
    script.onerror = () => setError('Không tải được thư viện quét QR')
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setLoading(false)
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Bạn cần cho phép truy cập camera để quét QR')
      } else if (err.name === 'NotFoundError') {
        setError('Không tìm thấy camera trên thiết bị này')
      } else {
        setError('Không thể khởi động camera: ' + (err.message || err.name))
      }
      setLoading(false)
    }
  }, [])

  // Start camera when component mounts
  useEffect(() => {
    startCamera()
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [startCamera])

  // Scan loop — runs when both video is ready and jsQR is loaded
  useEffect(() => {
    if (!jsQR) return
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const tick = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        })
        if (code && code.data) {
          // Stop camera and return the value
          if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
          if (rafRef.current) cancelAnimationFrame(rafRef.current)
          onScan(code.data)
          return
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [jsQR, onScan])

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-800 text-sm">Quét mã QR xe số</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera viewport */}
        <div className="relative bg-black" style={{ aspectRatio: '4/3' }}>
          {loading && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-sm">Đang khởi động camera...</span>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <AlertCircle className="w-10 h-10 text-red-400" />
              <p className="text-white text-sm leading-relaxed">{error}</p>
              <button
                onClick={() => { setError(null); setLoading(true); startCamera() }}
                className="text-xs bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Thử lại
              </button>
            </div>
          )}

          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            style={{ display: error ? 'none' : 'block' }}
          />

          {/* Scan frame overlay */}
          {!error && !loading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-48 h-48">
                {/* Corner brackets */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-white rounded-tl-lg" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'white', borderRight: 'none', borderBottom: 'none' }} />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-white rounded-tr-lg" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'white', borderLeft: 'none', borderBottom: 'none' }} />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-white rounded-bl-lg" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'white', borderRight: 'none', borderTop: 'none' }} />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-white rounded-br-lg" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'white', borderLeft: 'none', borderTop: 'none' }} />
                {/* Scan line animation */}
                <div className="absolute left-2 right-2 h-0.5 bg-blue-400/80 animate-scan-line" />
              </div>
            </div>
          )}

          {/* Hidden canvas for processing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <p className="text-xs text-center text-slate-500 py-3 px-4">
          Hướng camera vào mã QR trên xe nâng để tự động điền số xe
        </p>
      </div>
    </div>
  )
}
