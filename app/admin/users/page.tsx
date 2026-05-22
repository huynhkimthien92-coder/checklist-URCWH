'use client'
import { useState, useEffect } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { User } from '@/types'
import { cn, formatDate } from '@/lib/utils'
import { Users, Plus, Loader2, Trash2, ToggleLeft, ToggleRight, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'operator' })
  const [error, setError] = useState('')

  const fetchUsers = () => {
    fetch('/api/users')
      .then(r => r.json())
      .then(d => { setUsers(Array.isArray(d) ? d : []); setLoading(false) })
  }

  useEffect(() => { fetchUsers() }, [])

  const createUser = async () => {
    setSaving(true)
    setError('')
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    setSaving(false)
    if (data.error) { setError(data.error); return }
    setShowModal(false)
    setForm({ name: '', email: '', password: '', role: 'operator' })
    fetchUsers()
  }

  const toggleActive = async (id: string, active: boolean) => {
    await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active })
    })
    fetchUsers()
  }

  const deleteUser = async (id: string) => {
    if (!confirm('Xoá người dùng này?')) return
    await fetch(`/api/users/${id}`, { method: 'DELETE' })
    fetchUsers()
  }

  const roleLabel: Record<string, string> = { admin: 'Quản trị viên', operator: 'Tài xế', supervisor: 'Giám sát' }
  const roleColor: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    operator: 'bg-teal-100 text-teal-700',
    supervisor: 'bg-amber-100 text-amber-700'
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="btn-secondary p-2"><ArrowLeft className="w-4 h-4" /></Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Quản lý người dùng</h1>
              <p className="text-sm text-slate-500 mt-0.5">{users.length} tài khoản</p>
            </div>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Thêm người dùng
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
        ) : (
          <div className="card overflow-scroll">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header text-left">Họ tên</th>
                  <th className="table-header text-left">Email</th>
                  <th className="table-header text-left">Vai trò</th>
                  <th className="table-header text-left">Trạng thái</th>
                  <th className="table-header text-left">Ngày tạo</th>
                  <th className="table-header text-left">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="table-cell font-medium">{u.name}</td>
                    <td className="table-cell text-slate-500">{u.email}</td>
                    <td className="table-cell">
                      <span className={cn('badge', roleColor[u.role] || 'bg-gray-100 text-gray-600')}>
                        {roleLabel[u.role] || u.role}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={cn('badge', u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                        {u.active ? 'Hoạt động' : 'Tạm khoá'}
                      </span>
                    </td>
                    <td className="table-cell text-slate-500">{formatDate(u.created_at)}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleActive(u.id, u.active)} title={u.active ? 'Khoá' : 'Mở khoá'}
                          className="p-1 hover:text-blue-600 text-slate-400 transition-colors">
                          {u.active ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                        <button onClick={() => deleteUser(u.id)} title="Xoá"
                          className="p-1 hover:text-red-600 text-slate-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <h3 className="font-semibold text-slate-800">Thêm người dùng mới</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              <div className="p-5 space-y-4">
                {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Họ tên *</label>
                  <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nguyễn Văn A" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                  <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@company.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu *</label>
                  <input className="input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Tối thiểu 8 ký tự" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vai trò *</label>
                  <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    <option value="operator">Operator</option>
                    <option value="supervisor">Giám sát</option>
                    <option value="admin">Quản trị viên</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 px-5 pb-5">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Huỷ</button>
                <button onClick={createUser} disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {saving ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
