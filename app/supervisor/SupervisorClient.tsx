'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Checklist } from '@/types'
import {
  cn,
  checklistStatusLabel,
  checklistStatusColor,
  formatDate
} from '@/lib/utils'
import {
  ShieldCheck,
  Eye,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'

export default function SupervisorPage() {

  const [checklists, setChecklists] = useState<any[]>([])
  const [allChecklists, setAllChecklists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [filter, setFilter] = useState('submitted')     // status
  const [typeFilter, setTypeFilter] = useState('all')   // type

  // ================= FETCH ALL =================
  useEffect(() => {
    Promise.all([
      fetch('/api/checklists').then(r => r.json()),
      fetch('/api/robot-checklists').then(r => r.json()),
    ])
      .then(([forklift, robot]) => {

        const merged = [
          ...(Array.isArray(forklift) ? forklift : []).map(c => ({ ...c, type: 'forklift' })),
          ...(Array.isArray(robot) ? robot : []).map(c => ({ ...c, type: 'robot' })),
        ]

        setAllChecklists(merged)
      })
      .catch(() => setAllChecklists([]))
  }, [])

  // ================= FILTER =================
  useEffect(() => {
    setLoading(true)

    Promise.all([
      fetch('/api/checklists').then(r => r.json()),
      fetch('/api/robot-checklists').then(r => r.json()),
    ])
      .then(([forklift, robot]) => {

        let merged = [
          ...(Array.isArray(forklift) ? forklift : []).map(c => ({ ...c, type: 'forklift' })),
          ...(Array.isArray(robot) ? robot : []).map(c => ({ ...c, type: 'robot' })),
        ]

        // ✅ filter theo status
        if (filter !== 'all') {
          merged = merged.filter(c => c.status === filter)
        }

        // ✅ filter theo type
        if (typeFilter !== 'all') {
          merged = merged.filter(c => c.type === typeFilter)
        }

        setChecklists(merged)
        setLoading(false)
      })
      .catch(() => setLoading(false))

  }, [filter, typeFilter])

  // ================= COUNT =================
  const submitted = allChecklists.filter(c => c.status === 'submitted').length
  const approved  = allChecklists.filter(c => c.status === 'approved').length
  const draft     = allChecklists.filter(c => c.status === 'draft').length

  // ================= UI =================
  return (
    <div className="min-h-screen bg-slate-50">

      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        {/* HEADER */}
        <div>
          <h1 className="text-xl font-bold">Kiểm tra & Xét duyệt</h1>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-3">

          <div className="card p-4">
            <div className="flex gap-2 items-center">
              <Clock className="w-4 h-4 text-blue-500" />
              Chờ duyệt
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {submitted}
            </p>
          </div>

          <div className="card p-4">
            <div className="flex gap-2 items-center">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Đã duyệt
            </div>
            <p className="text-2xl font-bold text-green-600">
              {approved}
            </p>
          </div>

          <div className="card p-4">
            <div className="flex gap-2 items-center">
              <AlertCircle className="w-4 h-4 text-gray-400" />
              Bản nháp
            </div>
            <p className="text-2xl font-bold text-gray-600">
              {draft}
            </p>
          </div>

        </div>

        {/* ===== STATUS FILTER ===== */}
        <div className="flex gap-1 card p-1">
          {[
            { key: 'submitted', label: 'Chờ duyệt' },
            { key: 'approved', label: 'Đã duyệt' },
            { key: 'all', label: 'Tất cả' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                'flex-1 py-1.5 rounded text-sm',
                filter === key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ===== TYPE FILTER ===== */}
        <div className="flex gap-1 card p-1">
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'forklift', label: '🚜 Xe nâng' },
            { key: 'robot', label: '🤖 Robot' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={cn(
                'flex-1 py-1.5 rounded text-sm',
                typeFilter === key
                  ? 'bg-slate-800 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ===== LIST ===== */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin" />
          </div>
        ) : checklists.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            Không có dữ liệu
          </div>
        ) : (
          <div className="space-y-3">

            {checklists.map(cl => {

              const failCount =
                cl.items?.reduce((acc: number, item: any) =>
                  acc + Object.values(item.days || {})
                    .filter((d: any) => d.status === 'fail').length
                , 0) || 0

              return (
                <div
                  key={cl.id}
                  className="card p-4 hover:shadow"
                >

                  <div className="flex justify-between">

                    <div>

                      <div className="flex gap-2 items-center">

                        <span className="font-semibold">
                          {cl.week_number
                            ? `Tuần ${cl.week_number}/${cl.year}`
                            : `Tháng ${cl.month}/${cl.year}`
                          }
                        </span>

                        {/* TYPE */}
                        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                          {cl.type === 'robot'
                            ? '🤖 Robot'
                            : '🚜 Xe nâng'}
                        </span>

                        <span className={cn(
                          'badge',
                          checklistStatusColor(cl.status)
                        )}>
                          {checklistStatusLabel(cl.status)}
                        </span>

                        {failCount > 0 && (
                          <span className="text-red-600 text-xs">
                            ⚠ {failCount} lỗi
                          </span>
                        )}

                      </div>

                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(cl.updated_at)}
                      </div>

                    </div>

                    {/* LINK */}
                    <Link
                      href={
                        cl.type === 'robot'
                          ? `/robot-checklist/${cl.id}`
                          : `/supervisor/${cl.id}`
                      }
                      className="btn-primary text-sm px-3"
                    >
                      <Eye className="w-4 h-4" />
                      Xem
                    </Link>

                  </div>

                </div>
              )
            })}

          </div>
        )}

      </main>
    </div>
  )
}
