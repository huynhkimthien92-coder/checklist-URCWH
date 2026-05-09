'use client'
import { useState, useRef } from 'react'
import { X, Loader2, ImagePlus } from 'lucide-react'


interface ImageUploaderProps {
  value?: string
  onChange: (url: string) => void
  disabled?: boolean
  checklistId: string
  itemId: string
  day: string
}

export function ImageUploader({ value, onChange, disabled, checklistId, itemId, day }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(value || null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('checklistId', checklistId)
      formData.append('itemId', itemId)
      formData.append('day', day)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.url) {
        setPreview(data.url)
        onChange(data.url)
      }
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  const remove = () => {
    setPreview(null)
    onChange('')
    if (inputRef.current) inputRef.current.value = ''
  }

  if (preview) {
    return (
      <div className="relative inline-block">
        <a href={preview} target="_blank" rel="noopener noreferrer">
          <img src={preview} alt="Ảnh kiểm tra"
            className="w-14 h-14 object-cover rounded-lg border border-slate-200 hover:opacity-90 transition-opacity" />
        </a>
        {!disabled && (
          <button
            onClick={remove}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={disabled || uploading}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        className="flex items-center gap-1 px-2 py-1 border border-dashed border-slate-300 rounded-lg text-xs text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors disabled:opacity-40"
        title="Thêm ảnh"
      >
        {uploading
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <ImagePlus className="w-3.5 h-3.5" />
        }
        {uploading ? '' : 'Ảnh'}
      </button>
    </div>
  )
}
