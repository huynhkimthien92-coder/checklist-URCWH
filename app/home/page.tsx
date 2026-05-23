'use client'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import Link from 'next/link'
import {
  UserCog,
  Shield,
  Bot,
  Truck,
  ClipboardList,
  Loader2,
  LayoutGrid,
  ChevronDown
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { SignaturePad } from '@/components/forms/SignaturePad'
import { ChangePasswordModal } from '@/components/forms/ChangePasswordModal'

// ===== TYPE =====
type MenuItem = {
  label: string
  href: string
  icon: any
  color: string
  badge?: number
  roles?: string[]
}

// ===== MENU =====
const MENU: MenuItem[] = [
  { label: 'Admin', href: '/admin', icon: UserCog, color: 'bg-purple-100 text-purple-600', roles: ['admin'] },
  { label: 'Supervisor', href: '/supervisor', icon: Shield, color: 'bg-blue-100 text-blue-600', roles: ['admin', 'supervisor'] },
  { label: 'Dashboard Xe nâng', href: '/dashboard/forklift', icon: Truck, color: 'bg-green-100 text-green-600', roles: ['admin', 'supervisor'] },
  { label: 'Dashboard Robot', href: '/dashboard/robot', icon: Bot, color: 'bg-pink-100 text-pink-600', roles: ['admin', 'supervisor'] },
  { label: 'Checklist Xe nâng', href: '/checklist', icon: ClipboardList, color: 'bg-orange-100 text-orange-600', roles: ['admin', 'supervisor','operator'] },
  { label: 'Checklist Robot', href: '/robot-checklist', icon: Bot, color: 'bg-slate-100 text-slate-600', roles: ['admin', 'supervisor','operator'] },
  { label: '5S Management', href: '/5s', icon: LayoutGrid, color: 'bg-indigo-100 text-indigo-600', roles: ['admin', 'supervisor','operator'] },
]

// ===== COMPONENT =====

export default function HomePage() {
  const { data: session, status } = useSession()
  const [showChangePassword, setShowChangePassword] = useState(false)

  const [pending, setPending] = useState(0)
  const [openMenu, setOpenMenu] = useState(false)
  const [showSignature, setShowSignature] = useState(false)

  const menuRef = useRef<HTMLDivElement>(null)

  const [stats5S, setStats5S] = useState({
    open: 0,
    overdue: 0,
    high: 0
  })

  const prevRef = useRef({
    open: 0,
    overdue: 0,
    high: 0
  })

  const role = session?.user?.role

  // ===== CLICK OUTSIDE CLOSE DROPDOWN =====
  useEffect(() => {
    const handleClickOutside = (e: any) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ===== FETCH CHECKLIST =====
  useEffect(() => {
    if (!session) return

    fetch('/api/checklists')
      .then(r => r.json())
      .then(data => {
        const count =
          (data || []).filter((c: any) => c.status === 'submitted').length

        setPending(count)
      })
      .catch(() => {})
  }, [session])

  // ===== POLLING 5S =====
  useEffect(() => {
    if (!session) return

    const fetch5S = async () => {
      try {
        if (document.visibilityState !== 'visible') return

        const res = await fetch('/api/issues/count')
        const data = await res.json()

        const prev = prevRef.current

        const hasNew =
          data.open > prev.open ||
          data.overdue > prev.overdue ||
          data.high > prev.high

        if (hasNew) {
          try {
            new Audio('/notification.wav').play()
          } catch {}
        }

        prevRef.current = data
        setStats5S(data)

      } catch (err) {
        console.error('Fetch 5S error:', err)
      }
    }

    fetch5S()
    const interval = setInterval(fetch5S, 300000)

    return () => clearInterval(interval)
  }, [session])

  // ===== LOADING =====
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin w-6 h-6 text-blue-500" />
      </div>
    )
  }

  if (!session) return null

  // ===== BADGE =====
  const menuWithBadge = MENU.map(item => {
    if (item.href === '/supervisor') return { ...item, badge: pending }
    if (item.href === '/5s') return { ...item, badge: stats5S.open }
    return item
  })

  // ===== FILTER ROLE =====
  const menu = menuWithBadge.filter(item =>
    !item.roles || item.roles.includes(role!)
  )

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ===== HEADER USER ===== */}
      <div className="flex justify-end p-4">
        <div className="relative" ref={menuRef}>

          <button
            onClick={() => setOpenMenu(prev => !prev)}
            className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow text-sm"
          >
            {session.user?.name}
            <ChevronDown className="w-4 h-4" />
          </button>

          {openMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg overflow-hidden text-sm z-50 animate-fade-in">

              {/* <button
                onClick={() => {
                  setShowSignature(true)
                  setOpenMenu(false)
                }}
                className="w-full text-left px-4 py-2 hover:bg-slate-100"
              >
                ✍️ Cập nhật chữ ký
              </button>
              */}

              <button
                onClick={() =>{
                  setShowChangePassword(true)
                  setOpenMenu(false)
                }}
                className="w-full text-left px-4 py-2 hover:bg-slate-100"
              >
                🔒 Đổi mật khẩu
              </button>

              <button
                onClick={() => signOut({ callbackUrl: '/auth/login' })}
                className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50"
              >
                🚪 Đăng xuất
              </button>

            </div>
          )}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 pb-16">

        {/* GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">

          {menu.map(item => {
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className="card relative p-4 flex flex-col items-center justify-center text-center
                           hover:shadow-xl hover:-translate-y-1 active:scale-95 transition"
              >
                <div
                  className={cn(
                    'w-14 h-14 rounded-2xl flex items-center justify-center mb-2',
                    item.color
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>

                <span className="text-sm font-medium text-slate-700">
                  {item.label}
                </span>

                {item.badge && item.badge > 0 && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </div>
                )}
              </Link>
            )
          })}

        </div>

      </main>

      {/* ===== MODAL SIGNATURE ===== */}
      {showSignature && (
        <SignaturePad
          label="Cập nhật chữ ký"
          autoOpen
          onSave={() => {
            alert('✅ Đã cập nhật chữ ký')
            setShowSignature(false)
          }}
        />
      )}
      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}


    </div>
  )
}
