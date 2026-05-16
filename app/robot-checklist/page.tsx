'use client'
// app/robot-checklist/page.tsx
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Bot, FileDown } from 'lucide-react'
import { RobotChecklist } from '@/lib/robot-checklist-data'
import { RobotChecklistForm } from '@/components/forms/RobotChecklistForm'
import { useRouter } from 'next/navigation'

export default function RobotChecklistPage() {
  
  const { data: session } = useSession()
  
  const [checklists, setChecklists]   = useState<RobotChecklist[]>([])
  const [loading, setLoading]         = useState(true)
  const [showCreate, setShowCreate]   = useState(false)

  const now = new Date()
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1)
  const [filterYear, setFilterYear]   = useState(now.getFullYear())

  // Form tạo mới
  const [newRobotNumber, setNewRobotNumber] = useState('')
  const [creating, setCreating] = useState(false)

  const role = (session?.user as any)?.role

  const fetchChecklists = async () => {
    setLoading(true)
    const res = await fetch(`/api/robot-checklist?month=${filterMonth}&year=${filterYear}`)
    const data = await res.json()
    setChecklists(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { fetchChecklists() }, [filterMonth, filterYear])

  const createChecklist = async () => {
    if (!newRobotNumber.trim()) return
    setCreating(true)
    const res = await fetch('/api/robot-checklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        month: filterMonth,
        year: filterYear,
        robot_number: newRobotNumber.trim(),
        area: 'MROBOT',
      }),
    })
    if (res.ok) {
      const data = await res.json()
      setChecklists(prev => [data, ...prev])
      setSelected(data)
      setShowCreate(false)
      setNewRobotNumber('')
    } else {
      const err = await res.json()
      alert(err.error)
    }
    setCreating(false)
  }

  return (
    <div className="p-4 max-w-screen-xl mx-auto space-y-4">
      {/* Page header */}
      
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">
          Checklist Robot
        </h1>

        {(role === 'operator' || role === 'admin') && (
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary"
          >
            + Tạo checklist
          </button>
        )}
      </div>


      {/* Filter */}
      <div className="flex gap-3 items-center">
        <select
          value={filterMonth}
          onChange={e => setFilterMonth(Number(e.target.value))}
          className="input-field w-32"
        >
          {Array.from({length:12},(_,i)=>i+1).map(m=>(
            <option key={m} value={m}>Tháng {m}</option>
          ))}
        </select>
        <select
          value={filterYear}
          onChange={e => setFilterYear(Number(e.target.value))}
          className="input-field w-24"
        >
          {[2024,2025,2026,2027].map(y=>(
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-semibold text-slate-800">Tạo checklist robot mới</h3>
            <div>
              <label className="label">Số/Tên robot</label>
              <input
                value={newRobotNumber}
                onChange={e => setNewRobotNumber(e.target.value)}
                placeholder="VD: ROBOT-01"
                className="input-field w-full"
              />
            </div>
            <p className="text-sm text-slate-500">
              Tháng {filterMonth}/{filterYear}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Huỷ</button>
              <button onClick={createChecklist} disabled={creating} className="btn-primary flex-1">
                {creating ? 'Đang tạo...' : 'Tạo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* List */}
        <div className="lg:col-span-1 space-y-2">
          {loading ? (
            <p className="text-slate-400 text-sm">Đang tải...</p>
          ) : checklists.length === 0 ? (
            <p className="text-slate-400 text-sm italic">Chưa có checklist nào</p>
          ) : checklists.map(cl => (
            <button
              key={cl.id}
              onClick={() => router.push(`/robot-checklist/${cl.id}`)}
              className={`w-full text-left p-3 rounded-xl border transition-colors ${
                selected?.id === cl.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="font-medium text-slate-800">{cl.robot_number}</div>
              <div className="text-xs text-slate-500">Tháng {cl.month}/{cl.year}</div>
              <div className={`text-xs mt-1 ${
                cl.status === 'reviewed' ? 'text-green-600' :
                cl.status === 'submitted' ? 'text-yellow-600' : 'text-slate-400'
              }`}>
                {cl.status === 'reviewed' ? 'Đã duyệt' :
                 cl.status === 'submitted' ? 'Chờ duyệt' : 'Nháp'}
              </div>
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}
