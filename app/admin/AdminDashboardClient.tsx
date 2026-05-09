'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Users, ClipboardList, CheckCircle, AlertTriangle, Clock, TrendingUp, BarChart3 } from 'lucide-react'

interface Stats {
  totalUsers: number
  totalChecklists: number
  submitted: number
  approved: number
  draft: number
  failCount: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/users').then(r => r.json()),
      fetch('/api/checklists').then(r => r.json()),
    ]).then(([users, checklists]) => {
      const submitted = checklists.filter((c: any) => c.status === 'submitted').length
      const approved = checklists.filter((c: any) => c.status === 'approved').length
      const draft = checklists.filter((c: any) => c.status === 'draft').length
      const failCount = checklists.reduce((acc: number, c: any) =>
        acc + (c.items || []).reduce((a: number, item: any) =>
          a + Object.values(item.days || {}).filter((d: any) => d.status === 'fail').length, 0), 0)
      setStats({ totalUsers: users.length, totalChecklists: checklists.length, submitted, approved, draft, failCount })
    })
  }, [])

  const statCards = [
    { label: 'Người dùng', value: stats?.totalUsers ?? '—', icon: Users, color: 'bg-purple-50 text-purple-700', link: '/admin/users' },
    { label: 'Tổng Checklists', value: stats?.totalChecklists ?? '—', icon: ClipboardList, color: 'bg-blue-50 text-blue-700', link: '/admin/checklists' },
    { label: 'Chờ duyệt', value: stats?.submitted ?? '—', icon: Clock, color: 'bg-yellow-50 text-yellow-700', link: '/admin/checklists?status=submitted' },
    { label: 'Đã duyệt', value: stats?.approved ?? '—', icon: CheckCircle, color: 'bg-green-50 text-green-700', link: '/admin/checklists?status=approved' },
    { label: 'Bản nháp', value: stats?.draft ?? '—', icon: BarChart3, color: 'bg-slate-100 text-slate-600', link: '/admin/checklists?status=draft' },
    { label: 'Hạng mục lỗi', value: stats?.failCount ?? '—', icon: AlertTriangle, color: 'bg-red-50 text-red-700', link: '/admin/checklists' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Tổng quan hệ thống checklist xe nâng</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCards.map(card => (
            <Link key={card.label} href={card.link} className="card p-4 hover:shadow-md transition-shadow">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-slate-800">{card.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{card.label}</div>
            </Link>
          ))}
        </div>

        {/* Quick links */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Link href="/admin/users" className="card p-5 hover:shadow-md transition-shadow flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Quản lý người dùng</h3>
              <p className="text-sm text-slate-500 mt-1">Thêm tài khoản tài xế, giám sát. Phân quyền và quản lý trạng thái.</p>
            </div>
          </Link>
          <Link href="/admin/checklists" className="card p-5 hover:shadow-md transition-shadow flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <ClipboardList className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Quản lý Checklists</h3>
              <p className="text-sm text-slate-500 mt-1">Xem tất cả checklist, xuất báo cáo Excel, theo dõi tình trạng xe.</p>
            </div>
          </Link>
        </div>

        {/* Info panel */}
        <div className="card p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-800">Quy trình kiểm tra</h3>
              <div className="flex items-center gap-2 mt-2 text-sm text-blue-700 flex-wrap">
                {['Tài xế tạo checklist', '→', 'Điền kiểm tra hàng ngày', '→', 'Ký tên & Nộp báo cáo', '→', 'Giám sát xem xét', '→', 'Ký tên & Duyệt', '→', 'Xuất Excel'].map((s, i) => (
                  <span key={i} className={s === '→' ? 'text-blue-400' : 'font-medium'}>{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
