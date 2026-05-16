'use client'
import { signOut, useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LogOut, ClipboardCheck, Users, BarChart3, ShieldCheck, Menu, X, Bot } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const role = (session?.user as any)?.role
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    ...(role === 'admin' ? [
      { href: '/admin', label: 'Dashboard', icon: BarChart3 },
      { href: '/admin/users', label: 'Người dùng', icon: Users },
      { href: '/admin/checklists', label: 'Checklists', icon: ClipboardCheck },
    ] : []),
    ...(role === 'operator' ? [
      { href: '/checklist', label: 'Checklist Xe Nâng', icon: ClipboardCheck },
    ] : []),
    ...(role === 'supervisor' ? [
      { href: '/supervisor', label: 'Kiểm tra & Xét duyệt', icon: ShieldCheck },
    ] : []),
    // Robot checklist hiển thị cho tất cả role
    { href: '/robot-checklist', label: 'Checklist Robot', icon: Bot },
  ]

  const roleLabel: Record<string, string> = {
    admin: 'Quản trị viên', operator: 'Tài xế', supervisor: 'Giám sát'
  }
  const roleColor: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    operator: 'bg-teal-100 text-teal-700',
    supervisor: 'bg-amber-100 text-amber-700'
  }

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <ClipboardCheck className="w-4.5 h-4.5 text-white" size={18} />
            </div>
            <span className="font-semibold text-slate-800 text-sm hidden sm:block">
              Checklist URCWH
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  pathname.startsWith(href)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* User info + logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-slate-800 leading-tight">
                {session?.user?.name}
              </span>
              <span className={cn('badge text-xs mt-0.5', roleColor[role] || 'bg-gray-100 text-gray-600')}>
                {roleLabel[role] || role}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/auth/login' })}
              className="btn-secondary py-1.5 text-slate-500 hover:text-red-600 border-0"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Đăng xuất</span>
            </button>
            {/* Mobile menu */}
            <button
              className="md:hidden p-1.5 rounded-lg hover:bg-slate-100"
              onClick={() => setMobileOpen(v => !v)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
                pathname.startsWith(href)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-700 hover:bg-slate-100'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
