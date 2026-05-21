'use client'

import { useState } from 'react'

type Props = {
  x: number
  y: number
  onClose: () => void
  onCreated: () => void
}

export function AddIssueModal({ x, y, onClose, onCreated }: Props) {

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string>('')

  // ===== IMAGE PREVIEW =====
  const handleFile = (f: File) => {
    setFile(f)
    setPreview(URL.createObjectURL(f))
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

  // ===== UPLOAD =====
  const uploadImage = async (file: File, issueId: string) => {

    const resized = await resizeImage(file)

    const formData = new FormData()
    formData.append('file', resized)
    formData.append('issueId', issueId)
    formData.append('stage', 'before')

    const res = await fetch('/api/5s/upload', {
      method: 'POST',
      body: formData
    })

    const data = await res.json()
    return data.url
  }

  // ===== CREATE ISSUE =====
  const create = async () => {

    if (!title.trim()) {
      alert('⚠️ Nhập tiêu đề')
      return
    }

    if (!file) {
      alert('⚠️ Cần ảnh BEFORE')
      return
    }

    setLoading(true)

    try {
      // ✅ tạo ID tạm (để dùng folder)
      const tempId = crypto.randomUUID()

      // ✅ upload ảnh
      const imageUrl = await uploadImage(file, tempId)

      // ✅ save DB
      await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tempId,
          title,
          description,
          image_before: imageUrl,
          priority,
          due_date: dueDate || null,
          assigned_to: assignedTo || null,
          x_percent: x,
          y_percent: y
        })
      })

      onCreated()

    } catch (err) {
      alert('❌ Lỗi tạo issue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

      <div className="bg-white w-[400px] p-4 rounded space-y-3">

        <h2 className="font-semibold text-lg">Tạo Issue 5S</h2>

        {/* TITLE */}
        <input
          className="input w-full"
          placeholder="Tiêu đề *"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        {/* DESC */}
        <textarea
          className="input w-full"
          placeholder="Mô tả"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        {/* PRIORITY */}
        <select
          className="input w-full"
          value={priority}
          onChange={e => setPriority(e.target.value)}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        {/* DUE DATE */}
        <input
          type="date"
          className="input w-full"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
        />

        {/* ASSIGNEE */}
        <input
          className="input w-full"
          placeholder="Assign user id"
          value={assignedTo}
          onChange={e => setAssignedTo(e.target.value)}
        />

        {/* IMAGE */}
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={e => {
              if (e.target.files?.[0]) {
                handleFile(e.target.files[0])
              }
            }}
          />

          {preview && (
            <img
              src={preview}
              className="mt-2 w-full h-40 object-cover rounded"
              alt="preview"
            />
          )}
        </div>

        {/* ACTION */}
        <div className="flex gap-2">

          <button
            onClick={create}
            disabled={loading}
            className="btn-primary flex-1"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>

          <button
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>

        </div>

      </div>
    </div>
  )
}
