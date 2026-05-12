'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Checklist } from '@/types'
import { cn, checklistStatusLabel, checklistStatusColor, formatDate } from '@/lib/utils'
import { Plus, FileText, Download, Loader2, ClipboardList } from 'lucide-react'
import { getCurrentWeek } from '@/lib/utils'

export default function ChecklistListClient() {
  const router = useRouter()
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ forklift_model: '', forklift_serial: '', forklift_number: '', shift: '1' })

  useEffect(() => {
    fetch('/api/checklists')
      .then(r => {
        if (!r.ok) throw new Error('Failed')  // BUG FIX: was "if (r.ok)" - logic was inverted
        return r.json()
      })
      .then(d => { setChecklists(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const create = async () => {
    setCreating(true)
    const { week, year } = getCurrentWeek()
    const res = await fetch('/api/checklists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, week_number: week, year })
    })
    const data = await res.json()
    setCreating(false)
    setShowModal(false)
    if (data.id) router.push(`/checklist/${data.id}`)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Checklist của tôi</h1>
          <p className="text-sm text-slate-500 mt-0.5">Kiểm tra an toàn xe nâng hàng ngày</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Tạo checklist
        </button>
      </div>

      {/* List */}
      {checklists.length === 0 ? (
        <div className="card p-12 text-center">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Chưa có checklist nào</p>
          <p className="text-slate-400 text-sm mt-1">Tạo checklist mới để bắt đầu kiểm tra</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4">
            <Plus className="w-4 h-4" /> Tạo checklist mới
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {checklists.map(cl => {
            const passCount = cl.items?.reduce((acc, item) =>
              acc + Object.values(item.days || {}).filter(d => d.status === 'pass').length, 0) || 0
            const failCount = cl.items?.reduce((acc, item) =>
              acc + Object.values(item.days || {}).filter(d => d.status === 'fail').length, 0) || 0

            return (
              <div key={cl.id} className="card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800">
                          Tuần {cl.week_number}/{cl.year}
                        </span>
                        <span className={cn('badge', checklistStatusColor(cl.status))}>
                          {checklistStatusLabel(cl.status)}
                        </span>
                      </div>
                      <div className="text-sm text-slate-500 mt-0.5 space-x-2">
                        {cl.forklift_number && <span>Xe: {cl.forklift_number}</span>}
                        {cl.forklift_model && <span>· {cl.forklift_model}</span>}
                        <span>· Ca {cl.shift}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                        <span className="text-green-600 font-medium">✓ {passCount} đạt</span>
                        {failCount > 0 && <span className="text-red-600 font-medium">✗ {failCount} không đạt</span>}
                        <span>· {formatDate(cl.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/checklist/${cl.id}`} className="btn-primary text-xs py-1.5 px-3">
                      {cl.status === 'draft' ? 'Tiếp tục' : 'Xem'}
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-semibold text-slate-800">Tạo checklist mới</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Model xe</label>
                <input className="input" placeholder="VD: Toyota 8FBN25" value={form.forklift_model}
                  onChange={e => setForm(f => ({ ...f, forklift_model: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số Seri</label>
                <input className="input" placeholder="Serial number" value={form.forklift_serial}
                  onChange={e => setForm(f => ({ ...f, forklift_serial: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Xe số</label>
                <input className="input" placeholder="VD: XN-01" value={form.forklift_number}
                  onChange={e => setForm(f => ({ ...f, forklift_number: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ca làm việc</label>
                <select className="input" value={form.shift}
                  onChange={e => setForm(f => ({ ...f, shift: e.target.value }))}>
                  <option value="1">Ca 1</option>
                  <option value="2">Ca 2</option>
                  <option value="3">Ca 3</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Huỷ</button>
              <button onClick={create} disabled={creating} className="btn-primary flex-1 justify-center">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {creating ? 'Đang tạo...' : 'Tạo mới'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
