'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  cn,
  checklistStatusLabel,
  checklistStatusColor,
  formatDate
} from '@/lib/utils'
import {
  Plus,
  Loader2,
  Bot,
  Download,
  QrCode
} from 'lucide-react'
import { RobotChecklist } from '@/lib/robot-checklist-data'
import { QRScanner } from '@/components/forms/QRScanner'

// ===== HELPERS =====
function currentMonthYear() {
  const now = new Date()
  return { month: now.getMonth() + 1, year: now.getFullYear() }
}

function getMissingMonths(list: RobotChecklist[]) {
  if (!list.length) return []

  const months = list.map(c => c.month)
  const min = Math.min(...months)
  const max = Math.max(...months)

  const missing: number[] = []

  for (let i = min; i <= max; i++) {
    if (!months.includes(i)) missing.push(i)
  }

  return missing
}

// ===== COMPONENT =====
export default function RobotChecklistListClient() {

  const router = useRouter()

  const [checklists, setChecklists] = useState<RobotChecklist[]>([])
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)

  const [showQR, setShowQR] = useState(false)

  const [form, setForm] = useState({
    robot_number: '',
    area: 'MROBOT',
    month: 0,
    year: 0,
  })

  const { month: cm, year: cy } = currentMonthYear()

  // ===== FETCH =====
  useEffect(() => {
    fetch('/api/robot-checklist')
      .then(r => r.json())
      .then(d => {
        setChecklists(d || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // ===== GROUP =====
  const grouped = checklists.reduce((acc, cl) => {
    const key = cl.robot_number || 'Unknown'
    if (!acc[key]) acc[key] = []
    acc[key].push(cl)
    return acc
  }, {} as Record<string, RobotChecklist[]>)

  // ===== CREATE =====
  const create = async () => {
    if (!form.robot_number.trim()) {
      alert('⚠️ Nhập robot')
      return
    }

    setCreating(true)

    const res = await fetch('/api/robot-checklist', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        month: cm,
        year: cy
      })
    })

    const data = await res.json()

    setCreating(false)
    setShowModal(false)

    if (data.id) {
      router.push(`/robot-checklist/${data.id}`)
    }
  }

  // ✅ AUTO CREATE
  const createQuick = async (robot: string) => {
    const res = await fetch('/api/robot-checklist', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        robot_number: robot,
        area: 'MROBOT',
        month: cm,
        year: cy
      })
    })

    const data = await res.json()

    if (data.existed) {
      alert('Checklist tháng này đã tồn tại ✅')
    }

    if (data.id) {
      router.push(`/robot-checklist/${data.id}`)
    }
  }

  // ===== QR =====
  const handleQRScan = (value: string) => {
    setForm(f => ({ ...f, robot_number: value }))
    setShowQR(false)
  }

  // ===== LOADING =====
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
          <p className="text-sm text-slate-500">Quản lý theo tháng</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" /> Tạo
        </button>
      </div>

      {/* EMPTY */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center p-10">
          <Bot className="mx-auto text-gray-300 mb-3" />
          <p>Chưa có checklist</p>
        </div>
      ) : (

        <div className="space-y-5">

          {Object.entries(grouped).map(([robot, list]) => {

            const sorted = [...list].sort((a, b) => b.month - a.month)

            const missingMonths = getMissingMonths(list)

            const hasCurrentMonth = list.some(
              c => c.month === cm && c.year === cy
            )

            return (
              <div key={robot} className="card p-4 space-y-3">

                {/* HEADER */}
                <div className="flex justify-between items-center">

                  <div>
                    <h2 className="font-semibold text-lg">
                      🤖 {robot}
                    </h2>

                    {!hasCurrentMonth ? (
                      <p className="text-xs text-red-500">
                        ⚠ Chưa có tháng {cm}
                      </p>
                    ) : missingMonths.length > 0 ? (
                      <p className="text-xs text-orange-500">
                        ⚠ Thiếu tháng: {missingMonths.join(', ')}
                      </p>
                    ) : (
                      <p className="text-xs text-green-600">
                        ✅ Đầy đủ
                      </p>
                    )}
                  </div>

                  {!hasCurrentMonth && (
                    <button
                      onClick={() => createQuick(robot)}
                      className="text-xs bg-blue-600 text-white px-2 py-1 rounded"
                    >
                      + Tạo nhanh
                    </button>
                  )}

                </div>

                {/* LIST */}
                <div className="space-y-2">

                  {sorted.map(cl => {

                    let pass = 0
                    let fail = 0

                    cl.items.forEach(item => {
                      Object.values(item.days || {}).forEach((e: any) => {
                        if (e.status === 'pass') pass++
                        if (e.status === 'fail') fail++
                      })
                    })

                    return (
                      <div
                        key={cl.id}
                        className="flex justify-between items-center border rounded p-2"
                      >

                        <div>
                          <div className="flex gap-2 items-center">

                            <span className="font-medium">
                              Tháng {cl.month}
                            </span>

                            {cl.month === cm && (
                              <span className="text-xs text-blue-600">📍</span>
                            )}

                            <span className={cn(
                              'badge',
                              checklistStatusColor(cl.status)
                            )}>
                              {checklistStatusLabel(cl.status)}
                            </span>
                          </div>

                          <div className="text-xs text-gray-500">
                            {pass > 0 && <span className="text-green-600">✓ {pass}</span>}
                            {' '}
                            {fail > 0 && <span className="text-red-600">✗ {fail}</span>}
                            {' '}· {formatDate(cl.created_at)}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <a
                            href={`/api/robot-checklist/${cl.id}/pdf`}
                            className="btn-secondary text-xs px-2 py-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>

                          <Link
                            href={`/robot-checklist/${cl.id}`}
                            className="btn-primary text-xs px-3 py-1"
                          >
                            Xem
                          </Link>
                        </div>

                      </div>
                    )
                  })}

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
              <label className="text-sm">Robot</label>

              <div className="flex gap-2 mt-1">
                <input
                  className="input flex-1"
                  value={form.robot_number}
                  onChange={e =>
                    setForm({ ...form, robot_number: e.target.value })
                  }
                />

                <button
                  onClick={() => setShowQR(true)}
                  className="w-10 h-10 border rounded flex items-center justify-center"
                >
                  <QrCode className="w-5 h-5" />
                </button>
              </div>
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

      {/* QR */}
      {showQR && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowQR(false)}
        />
      )}

    </div>
  )
}
