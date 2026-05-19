'use client'
import { signOut, useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LogOut,
  ClipboardCheck,
  Users,
  BarChart3,
  ShieldCheck,
  Menu,
  X,
  Bot
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

// ================= COMPONENT =================
export function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const role = (session?.user as any)?.role
  const [mobileOpen, setMobileOpen] = useState(false)

  // ===== NAV LINKS =====
  const navLinks = [
    ...(role === 'admin'
      ? [
          { href: '/admin', label: 'Dashboard', icon: BarChart3 },
          { href: '/admin/users', label: 'Người dùng', icon: Users },
          { href: '/admin/checklists', label: 'Checklists', icon: ClipboardCheck },
        ]
      : []),

    ...(role === 'operator'
      ? [{ href: '/checklist', label: 'Checklist Xe Nâng', icon: ClipboardCheck }]
      : []),

    ...(role === 'supervisor'
      ? [{ href: '/supervisor', label: 'Kiểm tra & Xét duyệt', icon: ShieldCheck }]
      : []),

    // ✅ always show robot
    { href: '/robot-checklist', label: 'Checklist Robot', icon: Bot },
  ]

  // ===== ROLE LABEL =====
  const roleLabel: Record<string, string> = {
    admin: 'Quản trị viên',
    operator: 'Tài xế',
    supervisor: 'Giám sát',
  }

  const roleColor: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    operator: 'bg-teal-100 text-teal-700',
    supervisor: 'bg-amber-100 text-amber-700',
  }

  // ===== MATCH ROUTE =====
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  // ================= UI =================
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex justify-between items-center h-14">

          {/* ===== BRAND ===== */}
          <Link href="/" className="flex items-center gap-2.5">

            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-white" />
            </div>

            <span className="font-semibold text-slate-800 text-sm hidden sm:block">
              Checklist URCWH
            </span>
          </Link>

          {/* ===== DESKTOP NAV ===== */}
          <div className="hidden md:flex items-center gap-1">

            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  isActive(href)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}

          </div>

          {/* ===== USER ===== */}
          <div className="flex items-center gap-3">

            {/* Info */}
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-slate-800 leading-tight">
                {session?.user?.name}
              </span>

              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded',
                  roleColor[role] || 'bg-gray-100 text-gray-600'
                )}
              >
                {roleLabel[role] || role}
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={() => signOut({ callbackUrl: '/auth/login' })}
              className="flex items-center gap-1 text-slate-500 hover:text-red-600"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">
                Đăng xuất
              </span>
            </button>

            {/* Mobile toggle */}
            <button
              className="md:hidden p-1.5 rounded hover:bg-slate-100"
              onClick={() => setMobileOpen(v => !v)}
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

          </div>

        </div>
      </div>

      {/* ===== MOBILE ===== */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white px-4 py-3 space-y-1">

          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded text-sm font-medium',
                isActive(href)
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


