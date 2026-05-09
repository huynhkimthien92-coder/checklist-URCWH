'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Checklist } from '@/types'
import { cn, checklistStatusLabel, checklistStatusColor, formatDate } from '@/lib/utils'
import { Download, Loader2, ArrowLeft, Eye, Trash2 } from 'lucide-react'

export default function AdminChecklistsPage() {
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const fetchData = (status: string) => {
    setLoading(true)
    const params = status !== 'all' ? `?status=${status}` : ''
    fetch(`/api/checklists${params}`)
      .then(r => r.json())
      .then(d => { setChecklists(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchData(filter) }, [filter])

  const deleteChecklist = async (id: string) => {
    if (!confirm('Xoá checklist này?')) return
    await fetch(`/api/checklists/${id}`, { method: 'DELETE' })
    fetchData(filter)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="btn-secondary p-2">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Quản lý Checklists</h1>
            <p className="text-sm text-slate-500 mt-0.5">{checklists.length} checklist</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-1 card p-1 max-w-sm">
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'draft', label: 'Nháp' },
            { key: 'submitted', label: 'Chờ duyệt' },
            { key: 'approved', label: 'Đã duyệt' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                'flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all',
                filter === key
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header text-left">Tuần</th>
                  <th className="table-header text-left">Tài xế</th>
                  <th className="table-header text-left">Xe</th>
                  <th className="table-header text-left">Trạng thái</th>
                  <th className="table-header text-left">Kết quả</th>
                  <th className="table-header text-left">Ngày tạo</th>
                  <th className="table-header text-left">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {checklists.map(cl => {
                  const pass =
                    cl.items?.reduce(
                      (a, i) =>
                        a +
                        Object.values(i.days || {}).filter(d => d.status === 'pass').length,
                      0
                    ) || 0

                  const fail =
                    cl.items?.reduce(
                      (a, i) =>
                        a +
                        Object.values(i.days || {}).filter(d => d.status === 'fail').length,
                      0
                    ) || 0

                  return (
                    <tr key={cl.id} className="hover:bg-slate-50">
                      <td className="table-cell font-medium">
                        T{cl.week_number}/{cl.year}
                      </td>

                      <td className="table-cell">
                        {(cl as any).operator?.name || '—'}
                      </td>

                      <td className="table-cell text-slate-500">
                        {cl.forklift_number || '—'}{' '}
                        {cl.forklift_model && `(${cl.forklift_model})`}
                      </td>

                      <td className="table-cell">
                        <span className={cn('badge', checklistStatusColor(cl.status))}>
                          {checklistStatusLabel(cl.status)}
                        </span>
                      </td>

                      <td className="table-cell">
                        <span className="text-green-600 text-xs font-medium">
                          ✓{pass}
                        </span>
                        {fail > 0 && (
                          <span className="text-red-600 text-xs font-medium ml-2">
                            ✗{fail}
                          </span>
                        )}
                      </td>

                      <td className="table-cell text-slate-500 text-xs">
                        {formatDate(cl.created_at)}
                      </td>

                      <td className="table-cell">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`/api/reports/${cl.id}`}
                            className="p-1 hover:text-blue-600 text-slate-400"
                            title="Xuất Excel"
                          >
                            <Download className="w-4 h-4" />
                          </a>

                          <a
                            href={`/api/export-pdf/${cl.id}`}
                            target="_blank"
                            className="px-2 py-1 rounded hover:bg-gray-200"
                            title="Xuất PDF"
                          >
                            <span>PDF</span>
                          </a>

                          <Link
                            href={`/supervisor/${cl.id}`}
                            className="p-1 hover:text-blue-600 text-slate-400"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => deleteChecklist(cl.id)}
                            className="p-1 hover:text-red-600 text-slate-400"
                            title="Xoá"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {checklists.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                Không có checklist nào
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
