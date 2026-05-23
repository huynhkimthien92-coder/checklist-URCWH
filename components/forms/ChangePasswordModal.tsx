'use client'

import { useState } from 'react'

export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)

    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      alert('✅ Đổi mật khẩu thành công')
      onClose()

    } catch (err: any) {
      alert(err.message || 'Lỗi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-5 w-full max-w-sm animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold mb-4">Đổi mật khẩu</h3>

        <input
          type="password"
          placeholder="Mật khẩu cũ"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          className="input mb-2"
        />

        <input
          type="password"
          placeholder="Mật khẩu mới"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="input mb-4"
        />

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1">
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            className="btn-primary flex-1"
            disabled={loading}
          >
            {loading ? 'Đang đổi...' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  )
}
