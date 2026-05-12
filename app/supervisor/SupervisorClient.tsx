'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Checklist } from '@/types'
import { cn, checklistStatusLabel, checklistStatusColor, formatDate } from '@/lib/utils'
import { ShieldCheck, Eye, Download, Loader2, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'

export default function SupervisorPage() {
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [allChecklists, setAllChecklists] = useState<Checklist[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('submitted')

  useEffect(() => {
    fetch('/api/checklists')
      .then(r => {
      if (!r.ok) throw new Error('Failed')
      return r.json()
      })
      .then(d => setAllChecklists(Array.isArray(d) ? d : []))
      .catch(() => setAllChecklists([]))
  }, [])


  useEffect(() => {
    setLoading(true)
    const params = filter !== 'all' ? `?status=${filter}` : ''
    fetch(`/api/checklists${params}`)
      .then(r => {
        if (!r.ok) throw new Error('Failed')  // BUG FIX: was "if (r.ok)" - logic was inverted
        return r.json()
      })
      .then(d => { setChecklists(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filter])

  // Compute counts from ALL fetched (not filtered locally)
  const submitted = allChecklists.filter(c => c.status === 'submitted').length
  const approved  = allChecklists.filter(c => c.status === 'approved').length
  const draft     = allChecklists.filter(c => c.status === 'draft').length

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-slate-900">Kiểm tra & Xét duyệt</h1>
          <p className="text-sm text-slate-500 mt-0.5">Xem xét và xác nhận các checklist từ tài xế</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-slate-500">Chờ duyệt</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{submitted}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm text-slate-500">Đã duyệt</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{approved}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">Bản nháp</span>
            </div>
            <p className="text-2xl font-bold text-slate-500">{draft}</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 card p-1">
          {[
            { key: 'submitted', label: 'Chờ duyệt' },
            { key: 'approved',  label: 'Đã duyệt' },
            { key: 'all',       label: 'Tất cả' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                'flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-all',
                filter === key ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : checklists.length === 0 ? (
          <div className="card p-12 text-center">
            <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Không có checklist nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {checklists.map(cl => {
              const failCount = cl.items?.reduce((acc, item) =>
                acc + Object.values(item.days || {}).filter(d => d.status === 'fail').length, 0) || 0
              const passCount = cl.items?.reduce((acc, item) =>
                acc + Object.values(item.days || {}).filter(d => d.status === 'pass').length, 0) || 0

              return (
                <div key={cl.id} className={cn(
                  'card p-4 hover:shadow-md transition-shadow',
                  cl.status === 'submitted' && failCount > 0 ? 'border-l-4 border-l-red-400' :
                  cl.status === 'submitted' ? 'border-l-4 border-l-blue-400' : ''
                )}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800">
                          Tuần {cl.week_number}/{cl.year}
                        </span>
                        <span className={cn('badge', checklistStatusColor(cl.status))}>
                          {checklistStatusLabel(cl.status)}
                        </span>
                        {failCount > 0 && (
                          <span className="badge bg-red-100 text-red-700">
                            ⚠ {failCount} lỗi
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        <span className="font-medium text-slate-700">
                          {(cl as any).operator?.name || 'Tài xế'}
                        </span>
                        {cl.forklift_number && ` · Xe ${cl.forklift_number}`}
                        {cl.forklift_model && ` · ${cl.forklift_model}`}
                        <span className="ml-2 text-xs">· {formatDate(cl.updated_at)}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs">
                        <span className="text-green-600">✓ {passCount} đạt</span>
                        {failCount > 0 && <span className="text-red-600">✗ {failCount} không đạt</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/supervisor/${cl.id}`} className="btn-primary text-sm py-1.5 px-3">
                        <Eye className="w-3.5 h-3.5" />
                        {cl.status === 'submitted' ? 'Xét duyệt' : 'Xem'}
                      </Link>
                    </div>
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
