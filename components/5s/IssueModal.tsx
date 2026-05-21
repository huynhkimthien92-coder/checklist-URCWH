'use client'

import { useState } from 'react'

type Issue = {
  id: string
  title: string
  description?: string
  status: 'open' | 'in_progress' | 'done'
  priority: string
  image_before: string
  image_after?: string
  assigned_to?: string
  created_at?: string
  completed_by?: string
}

type Props = {
  issue: Issue
  onClose: () => void
  onUpdated: () => void
}

export function IssueModal({ issue, onClose, onUpdated }: Props) {

  const [current, setCurrent] = useState(issue)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(false)

  // ===== RESIZE =====
  const resizeImage = (file: File): Promise<Blob> => {
    return new Promise(resolve => {
      const img = new Image()
      const canvas = document.createElement('canvas')

      img.onload = () => {
        const MAX_WIDTH = 800
        const scale = MAX_WIDTH / img.width

        canvas.width = MAX_WIDTH
        canvas.height = img.height * scale

        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.7)

        URL.revokeObjectURL(img.src)
      }

      img.src = URL.createObjectURL(file)
    })
  }

  // ===== UPLOAD AFTER =====
  const uploadAfter = async (file: File) => {
    const resized = await resizeImage(file)

    const formData = new FormData()
    formData.append('file', resized)
    formData.append('issueId', current.id)
    formData.append('stage', 'after')

    const res = await fetch('/api/5s/upload', {
      method: 'POST',
      body: formData
    })

    const data = await res.json()
    return data.url
  }

  // ===== START WORKING =====
  const startWorking = async () => {
    setLoading(true)

    await fetch(`/api/issues/${current.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'in_progress'
      })
    })

    setCurrent(prev => ({ ...prev, status: 'in_progress' }))
    setLoading(false)
    onUpdated()
  }

  // ===== COMPLETE =====
  const complete = async () => {

    if (!file) {
      alert('⚠️ Cần ảnh AFTER')
      return
    }

    setLoading(true)

    const afterUrl = await uploadAfter(file)

    await fetch(`/api/issues/${current.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'done',
        image_after: afterUrl
      })
    })

    setCurrent(prev => ({
      ...prev,
      status: 'done',
      image_after: afterUrl
    }))

    setLoading(false)
    onUpdated()
  }

  // ===== ASSIGN =====
  const assign = async (userId: string) => {

    await fetch(`/api/issues/${current.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assigned_to: userId
      })
    })

    setCurrent(prev => ({ ...prev, assigned_to: userId }))
    onUpdated()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

      <div className="bg-white w-[500px] rounded p-4 space-y-4">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">{current.title}</h2>
          <button onClick={onClose}>✕</button>
        </div>

        {/* DESCRIPTION */}
        {current.description && (
          <p className="text-sm text-gray-600">{current.description}</p>
        )}

        {/* STATUS */}
        <div className="text-sm">
          Status: <b>{current.status}</b>
        </div>

        {/* ASSIGNEE */}
        <div>
          <input
            placeholder="Assign user id"
            className="input w-full"
            value={current.assigned_to || ''}
            onChange={e => assign(e.target.value)}
          />
        </div>

        {/* IMAGES */}
        <div className="grid grid-cols-2 gap-2">

          <div>
            <p className="text-xs">Before</p>
            <img
              src={current.image_before}
              className="w-full h-32 object-cover rounded"
            />
          </div>

          <div>
            <p className="text-xs">After</p>

            {current.image_after ? (
              <img
                src={current.image_after}
                className="w-full h-32 object-cover rounded"
              />
            ) : (
              <div className="border h-32 flex items-center justify-center text-xs text-gray-400">
                No image
              </div>
            )}
          </div>

        </div>

        {/* UPLOAD AFTER */}
        {current.status !== 'done' && (
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={e => {
                if (e.target.files?.[0]) {
                  setFile(e.target.files[0])
                  setPreview(URL.createObjectURL(e.target.files[0]))
                }
              }}
            />

            {preview && (
              <img
                src={preview}
                className="mt-2 w-full h-32 object-cover rounded"
              />
            )}
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex gap-2">

          {current.status === 'open' && (
            <button
              onClick={startWorking}
              className="btn-primary flex-1"
              disabled={loading}
            >
              Start Working
            </button>
          )}

          {current.status !== 'done' && (
            <button
              onClick={complete}
              className="btn-success flex-1"
              disabled={loading}
            >
              Mark Done
            </button>
          )}

          <button
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            Close
          </button>

        </div>

      </div>

    </div>
  )
}
