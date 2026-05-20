'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn, checklistStatusLabel, checklistStatusColor, formatDate } from '@/lib/utils'
import { Plus, Loader2, Bot, Download, QrCode } from 'lucide-react'
import { RobotChecklist } from '@/lib/robot-checklist-data'
import { ExportPDFButton } from '@/components/ExportPDFButton'
import { QRScanner } from '@/components/forms/QRScanner'

// ================= HELPERS =================
function currentMonthYear() {
  const now = new Date()
  return { month: now.getMonth() + 1, year: now.getFullYear() }
}

// ================= COMPONENT =================
export default function RobotChecklistListClient() {
  const router = useRouter()

  const [checklists, setChecklists] = useState<RobotChecklist[]>([])
  const [loading, setLoading] = useState(true)
  const [showQR, setShowQR] = useState(false)
  const handleQRScan = (value: string) => {
    setForm(f => ({ ...f, robot_number: value }))
    setShowQR(false)
  }


  const [openDropdown, setOpenDropdown] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedRobots, setSelectedRobots] = useState<string[]>([])

  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)

  const { month: cm, year: cy } = currentMonthYear()

  const [form, setForm] = useState({
    robot_number: '',
    area: 'MROBOT',
    month: cm,
    year: cy,
  })

  // ================= FETCH =================
  useEffect(() => {
    fetch('/api/robot-checklist')
      .then(r => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(d => {
        setChecklists(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // close dropdown
  useEffect(() => {
    const close = () => setOpenDropdown(false)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [])

  // ================= FILTER =================
  const robotOptions = Array.from(
    new Set(checklists.map(c => c.robot_number).filter(Boolean))
  )

  const filteredOptions = robotOptions.filter(r =>
    r.toLowerCase().includes(search.toLowerCase())
  )

  const filteredChecklists =
    selectedRobots.length === 0
      ? checklists
      : checklists.filter(cl =>
          selectedRobots.includes(cl.robot_number)
        )

  // ================= CREATE =================
  const create = async () => {
    if (!form.robot_number.trim()) {
      alert('⚠️ Nhập robot')
      return
    }

    setCreating(true)

    try {
      const res = await fetch('/api/robot-checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Tạo thất bại')
        return
      }

      if (data.id) {
        router.push(`/robot-checklist/${data.id}`)
      }
    } finally {
      setCreating(false)
      setShowModal(false)
    }
  }

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Checklist Robot</h1>
          <p className="text-sm text-slate-500">
            Kiểm tra theo tháng
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" /> Tạo
        </button>
      </div>

      {/* FILTER */}
      <div className="relative max-w-sm">
        <div
          onClick={e => {
            e.stopPropagation()
            setOpenDropdown(p => !p)
          }}
          className="input cursor-pointer flex justify-between"
        >
          {selectedRobots.length > 0
            ? selectedRobots.join(', ')
            : 'Filter robot'}
        </div>

        {openDropdown && (
          <div className="absolute z-50 bg-white border rounded p-2 w-full">
            <input
              className="input mb-2"
              placeholder="Search"
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
                      active
                        ? prev.filter(x => x !== rb)
                        : [...prev, rb]
                    )
                  }}
                  className="flex gap-2 p-1 hover:bg-gray-100 cursor-pointer"
                >
                  <input type="checkbox" checked={active} readOnly />
                  {rb}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* LIST */}
      {filteredChecklists.length === 0 ? (
        <div className="text-center p-10">
          <Bot className="mx-auto text-gray-300 mb-3" />
          <p>Chưa có checklist</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredChecklists.map(cl => {

            // ✅ FIX: dùng items.days
            let pass = 0
            let fail = 0

            cl.items.forEach(item => {
              Object.values(item.days || {}).forEach((e: any) => {
                if (e.status === 'pass') pass++
                if (e.status === 'fail') fail++
              })
            })

            return (
              <div key={cl.id} className="card p-4">

                <div className="flex justify-between">

                  {/* LEFT */}
                  <div>
                    <div className="flex gap-2 items-center">
                      <span className="font-semibold">
                        {cl.robot_number}
                      </span>

                      <span className={cn(
                        'badge',
                        checklistStatusColor(cl.status)
                      )}>
                        {checklistStatusLabel(cl.status)}
                      </span>
                    </div>

                    <div className="text-sm text-gray-500">
                      {cl.month}/{cl.year}
                    </div>

                    <div className="text-xs mt-1">
                      {pass > 0 && <span className="text-green-600">✓ {pass}</span>}
                      {' '}
                      {fail > 0 && <span className="text-red-600">✗ {fail}</span>}
                      {' '}· {formatDate(cl.created_at)}
                    </div>
                  </div>

                  {/* RIGHT */}
                  <div className="flex items-center gap-2">
                      <a
                        href={`/api/robot-checklist/${cl.id}/pdf`}
                        className="btn-secondary text-xs px-2 py-1.5"
                        title="Xuất PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    {/* ✅ VIEW */}
                    <Link
                      href={`/robot-checklist/${cl.id}`}
                      className="btn-primary text-sm px-3 py-1.5"
                    >
                      Xem
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
          <div className="bg-white p-5 rounded w-80 space-y-3">

            <h3 className="font-semibold">Tạo checklist</h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Robot
              </label>

              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="Nhập hoặc quét mã QR"
                  value={form.robot_number}
                  onChange={e =>
                    setForm({ ...form, robot_number: e.target.value })
                  }
                />

                <button
                  type="button"
                  onClick={() => setShowQR(true)}
                  title="Quét QR"
                  className={cn(
                    'flex-shrink-0 w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all',
                    form.robot_number
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-slate-200 bg-white text-slate-400 hover:border-blue-400 hover:text-blue-600'
                  )}
                >
                  <QrCode className="w-5 h-5" />
                </button>
              </div>

              <p className="mt-1 text-xs text-slate-400">
                Nhập tay hoặc quét QR trên robot
              </p>
            </div>


            <button
              onClick={create}
              className="btn-primary w-full"
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Create'}
            </button>

            <button
              onClick={() => setShowModal(false)}
              className="btn-secondary w-full"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {showQR && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowQR(false)}
        />
      )}
    </div>
  )
}
