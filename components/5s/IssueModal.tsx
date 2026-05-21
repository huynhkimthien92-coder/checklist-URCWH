'use client'

import { useEffect, useState } from 'react'
import { getIssueStyle } from '@/lib/issueStatus'
import { Issue } from '@/types/issue'   // ✅ FIX TYPE

// ===== TYPES =====
type User = {
  id: string
  name: string
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

  const [users, setUsers] = useState<User[]>([])
  const [zoomImage, setZoomImage] = useState<string | null>(null)

  // ===== FETCH USERS =====
  useEffect(() => {
    fetch('/api/users/search')
      .then(res => res.json())
      .then(data => setUsers(data || []))
  }, [])

  // ===== MAP USER =====
  const assignedUser = users.find(u => u.id === current.assigned_to)
  const completedUser = users.find(u => u.id === current.completed_by)

  // ✅ DESIGN SYSTEM
  const style = getIssueStyle(current)

  // ===== FORMAT DATE =====
  const formatDate = (d?: string) => {
    if (!d) return '-'
    return new Date(d).toLocaleString()
  }

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

  // ===== START =====
  const startWorking = async () => {
    setLoading(true)

    await fetch(`/api/issues/${current.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'in_progress' })
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

        {/* INFO */}
        <div className="text-sm space-y-1">

          {/* ✅ STATUS (SYNC WITH MAP) */}
          <div>
            Status:{' '}
            <b className={style.text}>
              {style.icon} {style.label}
            </b>
          </div>

          <div>
            Created: <b>{formatDate(current.created_at)}</b>
          </div>

          <div>
            Priority: <b>{current.priority}</b>
          </div>

          <div>
            Assigned to: <b>{assignedUser?.name || 'Unassigned'}</b>
          </div>

          <div>
            Completed by: <b>{completedUser?.name || '-'}</b>
          </div>

          <div>
            Completed: <b>{formatDate(current.closed_at)}</b>
          </div>

        </div>

        {/* IMAGES */}
        <div className="grid grid-cols-2 gap-2">

          <div>
            <p className="text-xs">Before</p>
            <img
              src={current.image_before}
              className="w-full h-32 object-cover rounded cursor-pointer"
              onClick={() => setZoomImage(current.image_before)}
            />
          </div>

          <div>
            <p className="text-xs">After</p>

            {current.image_after ? (
              <img
                src={current.image_after}
                className="w-full h-32 object-cover rounded cursor-pointer"
                onClick={() => setZoomImage(current.image_after!)}
              />
            ) : (
              <div className="border h-32 flex items-center justify-center text-xs text-gray-400">
                No image
              </div>
            )}
          </div>

        </div>

        {/* UPLOAD */}
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
            <button onClick={startWorking} className="btn-primary flex-1">
              Start Working
            </button>
          )}

          {current.status !== 'done' && (
            <button onClick={complete} className="btn-success flex-1">
              Mark Done
            </button>
          )}

          <button onClick={onClose} className="btn-secondary flex-1">
            Close
          </button>

        </div>

      </div>

      {/* ZOOM */}
      {zoomImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[999]">

          <div className="relative">

            <img
              src={zoomImage}
              className="max-h-[90vh] max-w-[90vw] rounded"
            />

            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-2 right-2 bg-white px-2 py-1 rounded text-sm"
            >
              ✕
            </button>

          </div>

        </div>
      )}

    </div>
  )
}
