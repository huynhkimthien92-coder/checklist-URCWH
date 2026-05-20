'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Checklist } from '@/types'
import {
  cn,
  checklistStatusLabel,
  checklistStatusColor,
  formatDate,
  getCurrentWeek
} from '@/lib/utils'
import {
  Plus,
  Download,
  Loader2,
  ClipboardList,
  QrCode
} from 'lucide-react'
import { QRScanner } from '@/components/forms/QRScanner'
import { ExportPDFButton } from '@/components/ExportPDFButton'

export default function ChecklistListClient() {
  const router = useRouter()

  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showQR, setShowQR] = useState(false)

  const [form, setForm] = useState({
    forklift_model: '',
    forklift_serial: '',
    forklift_number: '',
    shift: '1'
  })

  // 🔥 current week
  const { week: currentWeek, year: currentYear } = getCurrentWeek()

  // ================= FETCH =================
  useEffect(() => {
    fetch('/api/checklists')
      .then(r => r.json())
      .then(d => {
        setChecklists(d || [])
        setLoading(false)
      })
  }, [])

  // ================= GROUP =================
  const grouped = checklists.reduce((acc, cl) => {
    const key = cl.forklift_number || 'Không xác định'

    if (!acc[key]) acc[key] = []
    acc[key].push(cl)

    return acc
  }, {} as Record<string, Checklist[]>)

  // ================= HELPERS =================

  function getMissingWeeks(list: Checklist[]) {
    if (list.length === 0) return []

    const weeks = list.map(c => c.week_number)
    const min = Math.min(...weeks)
    const max = Math.max(...weeks)

    const missing: number[] = []

    for (let i = min; i <= max; i++) {
      if (!weeks.includes(i)) missing.push(i)
    }

    return missing
  }

  // ================= CREATE =================
  const create = async () => {
    const { week, year } = getCurrentWeek()

    setCreating(true)

    const res = await fetch('/api/checklists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, week_number: week, year })
    })

    const data = await res.json()

    setCreating(false)
    setShowModal(false)

    if (data.id) {
      router.push(`/checklist/${data.id}`)
    }
  }

  // ✅ AUTO CREATE
  const createQuick = async (forklift: string) => {
    const res = await fetch('/api/checklists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        forklift_number: forklift,
        week_number: currentWeek,
        year: currentYear,
        shift: '1'
      })
    })

    const data = await res.json()

    if (data.existed) {
      alert('Checklist tuần này đã tồn tại ✅')
    }

    if (data.id) {
      router.push(`/checklist/${data.id}`)
    }
  }

  // ================= QR =================
  const handleQRScan = (value: string) => {
    setForm(f => ({ ...f, forklift_number: value }))
    setShowQR(false)
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
          <h1 className="text-xl font-bold">Checklist của tôi</h1>
          <p className="text-sm text-slate-500">
            Quản lý theo tuần
          </p>
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
          <ClipboardList className="mx-auto text-gray-300 mb-2" />
          <p>Chưa có checklist</p>
        </div>
      ) : (

        <div className="space-y-6">

          {Object.entries(grouped).map(([forklift, list]) => {

            const sorted = [...list].sort(
              (a, b) => b.week_number - a.week_number
            )

            const missingWeeks = getMissingWeeks(list)

            const hasCurrentWeek = list.some(
              c => c.week_number === currentWeek && c.year === currentYear
            )

            return (
              <div key={forklift} className="card p-4 space-y-3">

                {/* ===== HEADER XE ===== */}
                <div className="flex justify-between items-center">

                  <div>
                    <h2 className="font-semibold text-lg">
                      🚜 {forklift}
                    </h2>

                    {!hasCurrentWeek ? (
                      <p className="text-xs text-red-500">
                        ⚠ Chưa có checklist tuần {currentWeek}
                      </p>
                    ) : missingWeeks.length > 0 ? (
                      <p className="text-xs text-orange-500">
                        ⚠ Thiếu tuần: {missingWeeks.join(', ')}
                      </p>
                    ) : (
                      <p className="text-xs text-green-600">
                        ✅ Đầy đủ
                      </p>
                    )}
                  </div>

                  {!hasCurrentWeek && (
                    <button
                      onClick={() => createQuick(forklift)}
                      className="text-xs bg-blue-600 text-white px-2 py-1 rounded"
                    >
                      + Tạo nhanh
                    </button>
                  )}

                </div>

                {/* ===== LIST TUẦN ===== */}
                <div className="space-y-2">

                  {sorted.map(cl => {

                    const pass =
                      cl.items?.reduce(
                        (acc, item) =>
                          acc +
                          Object.values(item.days || {}).filter(
                            (d: any) => d.status === 'pass'
                          ).length,
                        0
                      ) || 0

                    const fail =
                      cl.items?.reduce(
                        (acc, item) =>
                          acc +
                          Object.values(item.days || {}).filter(
                            (d: any) => d.status === 'fail'
                          ).length,
                        0
                      ) || 0

                    return (
                      <div
                        key={cl.id}
                        className="flex justify-between items-center bg-white border rounded p-2"
                      >

                        <div>
                          <div className="flex gap-2 items-center">

                            <span className="font-medium">
                              Tuần {cl.week_number}
                            </span>

                            {cl.week_number === currentWeek && (
                              <span className="text-xs text-blue-600">
                                📍
                              </span>
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

                          <ExportPDFButton
                            checklistId={cl.id}
                            filename={`XeNang_Tuan${cl.week_number}_${cl.year}_${forklift}.pdf`}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </ExportPDFButton>

                          <Link
                            href={`/checklist/${cl.id}`}
                            className="btn-primary text-xs px-2 py-1"
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

      {/* MODAL CREATE */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
          <div className="bg-white p-4 rounded w-80 space-y-3">

            <input
              className="input"
              placeholder="Xe"
              value={form.forklift_number}
              onChange={e =>
                setForm({ ...form, forklift_number: e.target.value })
              }
            />

            <button
              onClick={() => setShowQR(true)}
              className="btn-secondary w-full flex gap-2 justify-center"
            >
              <QrCode className="w-4 h-4" /> Scan QR
            </button>

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
