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
  Bot,
  Truck,
  ChevronDown
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

// ================= COMPONENT =================
export function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const role = (session?.user as any)?.role

  const [mobileOpen, setMobileOpen] = useState(false)
  const [dashboardOpen, setDashboardOpen] = useState(false)

  // ===== NAV LINKS (không bao gồm dashboard) =====
  const navLinks = [

    // ===== ADMIN =====
    ...(role === 'admin'
      ? [
          { href: '/admin', label: 'Dashboard Admin', icon: BarChart3 },
          { href: '/admin/users', label: 'Người dùng', icon: Users },
          { href: '/admin/checklists', label: 'Checklists', icon: ClipboardCheck },

          { href: '/checklist', label: 'Checklist Xe Nâng', icon: ClipboardCheck },
          { href: '/robot-checklist', label: 'Checklist Robot', icon: Bot },
        ]
      : []),

    // ===== OPERATOR =====
    ...(role === 'operator'
      ? [
          { href: '/checklist', label: 'Checklist Xe Nâng', icon: ClipboardCheck },
          { href: '/robot-checklist', label: 'Checklist Robot', icon: Bot },
        ]
      : []),

    // ===== SUPERVISOR =====
    ...(role === 'supervisor'
      ? [
          { href: '/supervisor', label: 'Kiểm tra & Xét duyệt', icon: ShieldCheck },

          { href: '/checklist', label: 'Checklist Xe Nâng', icon: ClipboardCheck },
          { href: '/robot-checklist', label: 'Checklist Robot', icon: Bot },
        ]
      : []),
  ]

  // ===== CHECK ACTIVE =====
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

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

  // ================= UI =================
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">

      <div className="max-w-7xl mx-auto px-4">

        <div className="flex justify-between items-center h-14">

          {/* ===== BRAND ===== */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm hidden sm:block">
              Checklist URCWH
            </span>
          </Link>

          {/* ===== DESKTOP NAV ===== */}
          <div className="hidden md:flex items-center gap-1">

            {/* ===== DASHBOARD DROPDOWN ===== */}
            {(role === 'admin' || role === 'supervisor') && (
              <div className="relative">

                <button
                  onClick={() => setDashboardOpen(v => !v)}
                  className={cn(
                    'flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium',
                    pathname.startsWith('/dashboard')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  <BarChart3 className="w-4 h-4" />
                  Dashboard
                  <ChevronDown className="w-4 h-4" />
                </button>

                {dashboardOpen && (
                  <div className="absolute left-0 top-10 w-48 bg-white border rounded shadow z-50">

                    <Link
                      href="/dashboard/robot"
                      className="block px-3 py-2 text-sm hover:bg-gray-100"
                      onClick={() => setDashboardOpen(false)}
                    >
                      🤖 Robot Dashboard
                    </Link>

                    <Link
                      href="/dashboard/forklift"
                      className="block px-3 py-2 text-sm hover:bg-gray-100"
                      onClick={() => setDashboardOpen(false)}
                    >
                      🚜 Forklift Dashboard
                    </Link>

                  </div>
                )}
              </div>
            )}

            {/* ===== LINKS ===== */}
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded text-sm',
                  isActive(href)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}

          </div>

          {/* ===== USER ===== */}
          <div className="flex items-center gap-3">

            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium">
                {session?.user?.name}
              </span>

              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded',
                  roleColor[role] || 'bg-gray-100'
                )}
              >
                {roleLabel[role] || role}
              </span>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: '/auth/login' })}
              className="text-slate-500 hover:text-red-600"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* MOBILE BUTTON */}
            <button
              className="md:hidden"
              onClick={() => setMobileOpen(v => !v)}
            >
              {mobileOpen ? <X /> : <Menu />}
            </button>

          </div>

        </div>
      </div>

      {/* ===== MOBILE ===== */}
      {mobileOpen && (
        <div className="md:hidden border-t p-3 space-y-1">

          {(role === 'admin' || role === 'supervisor') && (
            <>
              <Link
                href="/dashboard/robot"
                className="block px-3 py-2 text-sm hover:bg-gray-100"
              >
                🤖 Robot Dashboard
              </Link>

              <Link
                href="/dashboard/forklift"
                className="block px-3 py-2 text-sm hover:bg-gray-100"
              >
                🚜 Forklift Dashboard
              </Link>
            </>
          )}

          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
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
