'use client'
// app/robot-checklist/RobotChecklistListClient.tsx
// FIX:
//  1. Client Component — fetch dynamic, không bị stale như Server Component
//  2. Filter theo robot_number (giống forklift filter theo forklift_number)
//  3. Nút "Tạo checklist" + modal (forklift đã có, robot chưa có)
//  4. Badge status có màu — trước đây chỉ hiện text thô

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn, checklistStatusLabel, checklistStatusColor, formatDate } from '@/lib/utils'
import { Plus, Loader2, Bot, Download } from 'lucide-react'
import { RobotChecklist } from '@/lib/robot-checklist-data'

// ─── helpers ────────────────────────────────────────────────────────────────

function currentMonthYear() {
  const now = new Date()
  return { month: now.getMonth() + 1, year: now.getFullYear() }
}

// ─── component ──────────────────────────────────────────────────────────────

export default function RobotChecklistListClient() {
  const router = useRouter()

  // data
  const [checklists, setChecklists] = useState<RobotChecklist[]>([])
  const [loading, setLoading]       = useState(true)

  // filter
  const [openDropdown,    setOpenDropdown]    = useState(false)
  const [search,          setSearch]          = useState('')
  const [selectedRobots,  setSelectedRobots]  = useState<string[]>([])

  // create modal
  const [showModal, setShowModal] = useState(false)
  const [creating,  setCreating]  = useState(false)
  const { month: cm, year: cy } = currentMonthYear()
  const [form, setForm] = useState({
    robot_number: '',
    area:         'MROBOT',
    month:        cm,
    year:         cy,
  })

  // ── fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/robot-checklist')
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json() })
      .then(d  => { setChecklists(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // close dropdown on outside click
  useEffect(() => {
    const close = () => setOpenDropdown(false)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [])

  // ── derived ──────────────────────────────────────────────────────────────
  const robotOptions = Array.from(
    new Set(checklists.map(c => c.robot_number).filter(Boolean))
  )
  const filteredOptions = robotOptions.filter(r =>
    r.toLowerCase().includes(search.toLowerCase())
  )
  const filteredChecklists =
    selectedRobots.length === 0
      ? checklists
      : checklists.filter(cl => selectedRobots.includes(cl.robot_number))

  // ── create ───────────────────────────────────────────────────────────────
  const create = async () => {
    if (!form.robot_number.trim()) {
      alert('⚠️ Vui lòng nhập số robot')
      return
    }
    setCreating(true)
    try {
      const res  = await fetch('/api/robot-checklist', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json()

      if (res.status === 409) {
        alert('⚠️ Checklist tháng này đã tồn tại cho robot này')
        return
      }
      if (!res.ok) {
        alert('❌ Tạo thất bại: ' + (data.error || 'Lỗi không xác định'))
        return
      }
      if (data.id) router.push(`/robot-checklist/${data.id}`)
    } finally {
      setCreating(false)
      setShowModal(false)
    }
  }

  // ── render ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
    </div>
  )

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Checklist Robot</h1>
          <p className="text-sm text-slate-500 mt-0.5">Kiểm tra an toàn robot hàng ngày theo tháng</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Tạo checklist
        </button>
      </div>

      {/* ── Filter dropdown ── */}
      <div className="relative w-full max-w-sm">
        <div
          onClick={e => { e.stopPropagation(); setOpenDropdown(p => !p) }}
          className="input cursor-pointer flex justify-between items-center"
        >
          <span className="text-sm text-slate-600">
            {selectedRobots.length > 0 ? selectedRobots.join(', ') : 'Chọn robot để lọc'}
          </span>
          <span className="text-slate-400">▼</span>
        </div>

        {openDropdown && (
          <div className="absolute z-50 mt-2 w-full bg-white border rounded-lg shadow-lg p-2 max-h-60 overflow-auto">
            <input
              className="input mb-2 text-sm"
              placeholder="Tìm robot..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
            {filteredOptions.map(rb => {
              const active = selectedRobots.includes(rb)
              return (
                <div
                  key={rb}
                  onClick={e => {
                    e.stopPropagation()
                    setSelectedRobots(prev =>
                      active ? prev.filter(x => x !== rb) : [...prev, rb]
                    )
                  }}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 rounded cursor-pointer"
                >
                  <input type="checkbox" checked={active} readOnly />
                  <span className="text-sm">{rb}</span>
                </div>
              )
            })}
            {filteredOptions.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-2">Không tìm thấy</p>
            )}
          </div>
        )}

        {selectedRobots.length > 0 && (
          <button
            onClick={() => setSelectedRobots([])}
            className="text-xs text-blue-500 mt-1"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* ── List ── */}
      {filteredChecklists.length === 0 ? (
        <div className="card p-12 text-center">
          <Bot className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Chưa có checklist nào</p>
          <p className="text-slate-400 text-sm mt-1">Tạo checklist mới để bắt đầu kiểm tra</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4">
            <Plus className="w-4 h-4" /> Tạo checklist mới
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredChecklists.map(cl => {
            // đếm pass/fail trong tháng
            let passCount = 0, failCount = 0
            Object.values(cl.day_entries || {}).forEach(dayMap => {
              Object.values(dayMap).forEach((entry: any) => {
                if (entry.status === 'pass') passCount++
                if (entry.status === 'fail') failCount++
              })
            })

            return (
              <div key={cl.id} className="card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800">
                          {cl.robot_number}
                        </span>
                        {/* ✅ Badge status có màu — trước chỉ có text thô */}
                        <span className={cn('badge', checklistStatusColor(cl.status))}>
                          {checklistStatusLabel(cl.status)}
                        </span>
                      </div>
                      <div className="text-sm text-slate-500 mt-0.5 space-x-2">
                        <span>Tháng {cl.month}/{cl.year}</span>
                        {cl.area && <span>· {cl.area}</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                        {passCount > 0 && <span className="text-green-600 font-medium">✓ {passCount} đạt</span>}
                        {failCount > 0 && <span className="text-red-600 font-medium">✗ {failCount} không đạt</span>}
                        <span>· {formatDate(cl.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Export PDF */}
                    <a
                      href={`/api/robot-checklist/${cl.id}/pdf`}
                      className="btn-secondary text-xs py-1.5 px-2.5"
                      title="Xuất PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <Link
                      href={`/robot-checklist/${cl.id}`}
                      className="btn-primary text-xs py-1.5 px-3"
                    >
                      {cl.status === 'draft' ? 'Tiếp tục' : 'Xem'}
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Create modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-semibold text-slate-800">Tạo checklist robot mới</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Robot number */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Số / Tên Robot <span className="text-red-500">*</span>
                </label>
                <input
                  className="input"
                  placeholder="VD: ROBOT-01"
                  value={form.robot_number}
                  onChange={e => setForm(f => ({ ...f, robot_number: e.target.value }))}
                />
              </div>

              {/* Area */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Khu vực</label>
                <input
                  className="input"
                  placeholder="VD: MROBOT"
                  value={form.area}
                  onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                />
              </div>

              {/* Month / Year */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tháng</label>
                  <select
                    className="input"
                    value={form.month}
                    onChange={e => setForm(f => ({ ...f, month: parseInt(e.target.value) }))}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>Tháng {m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Năm</label>
                  <select
                    className="input"
                    value={form.year}
                    onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) }))}
                  >
                    {[cy - 1, cy, cy + 1].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-5 pb-5">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary flex-1 justify-center"
              >
                Huỷ
              </button>
              <button
                onClick={create}
                disabled={creating}
                className="btn-primary flex-1 justify-center"
              >
                {creating
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo...</>
                  : <><Plus className="w-4 h-4" /> Tạo mới</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
