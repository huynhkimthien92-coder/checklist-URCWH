'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase'

export default function ForkliftDashboardPage() {

  const [data, setData] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<'forklift' | 'week' | 'status' | 'fail' | 'signature'>('week')
  const [sortAsc, setSortAsc] = useState(false)

  const supabase = createBrowserClient()

  const DAYS = ['mon','tue','wed','thu','fri','sat','sun']

  // ================= FETCH =================
  useEffect(() => {
    supabase
      .from('checklists')
      .select('*')
      .then(({ data }) => {
        setData(data || [])
        setLoading(false)
      })
  }, [supabase])

  // ================= PROCESS =================
  useEffect(() => {

    const STATUS_ORDER: Record<string, number> = {
      submitted: 0,
      approved: 1,
      draft: 2
    }

    let result = (data || []).map(c => {

      let items: any[] = []
      try {
        items = Array.isArray(c.items)
          ? c.items
          : JSON.parse(c.items || '[]')
      } catch {}

      let supSigns: any = {}
      try {
        supSigns = typeof c.supervisor_signatures === 'string'
          ? JSON.parse(c.supervisor_signatures || '{}')
          : c.supervisor_signatures || {}
      } catch {}

      const daysSet = new Set<string>()
      const failSet = new Set<string>()

      items.forEach(item => {
        const days = item && typeof item.days === 'object' && item.days !== null ? item.days : {}

        Object.entries(days).forEach(([day, entry]: any) => {
          const status =
            typeof entry === 'string'
              ? entry
              : entry?.status

          if (
            DAYS.includes(day) &&
            (status === 'pass' || status === 'fail')
          ) {
            daysSet.add(day)
          }

          if (status === 'fail') {
            failSet.add(day)
          }
        })
      })

      const daysArray = Array.from(daysSet).sort(
        (a, b) => DAYS.indexOf(a) - DAYS.indexOf(b)
      )

      const unsignedSupervisor = daysArray.filter(
        d => !supSigns?.[d]?.data_url
      )

      // ✅ signature score (để sort)
      const signatureScore =
        unsignedSupervisor.length > 0 ? 0 : 1

      return {
        ...c,
        daysArray,
        failSet: Array.from(failSet),
        failCount: failSet.size,
        percent: Math.round((daysArray.length / 7) * 100),
        unsignedSupervisorCount: unsignedSupervisor.length,
        signatureScore,
        statusOrder: STATUS_ORDER[c.status] ?? 99
      }
    })

    // ===== FILTER =====
    if (search) {
      result = result.filter(c =>
        (c.forklift_number || '').toLowerCase().includes(search.toLowerCase())
      )
    }

    // ===== SORT =====
    result.sort((a, b) => {

      let aVal: any
      let bVal: any

      if (sortKey === 'forklift') {
        aVal = a.forklift_number || ''
        bVal = b.forklift_number || ''
      }
      else if (sortKey === 'week') {
        aVal = a.week_number
        bVal = b.week_number
      }
      else if (sortKey === 'status') {
        aVal = a.statusOrder
        bVal = b.statusOrder
      }
      else if (sortKey === 'fail') {
        aVal = a.failCount
        bVal = b.failCount
      }
      else if (sortKey === 'signature') {
        aVal = a.signatureScore
        bVal = b.signatureScore
      }

      if (aVal < bVal) return sortAsc ? -1 : 1
      if (aVal > bVal) return sortAsc ? 1 : -1
      return 0
    })

    setFiltered(result)

  }, [data, search, sortKey, sortAsc])

  // ================= SORT CLICK =================
  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  if (loading) return <div className="p-4">Loading...</div>

  return (
    <div className="space-y-4">

      <h1 className="text-xl font-bold">📊 Forklift Checklist Dashboard</h1>

      {/* FILTER */}
      <input
        placeholder="🔍 Tìm theo xe..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border px-3 py-1 rounded text-sm"
      />

      <table className="w-full border text-sm bg-white">

        <thead className="bg-slate-100">
          <tr>
            <th onClick={() => toggleSort('forklift')} className="cursor-pointer p-2 border">Xe</th>
            <th onClick={() => toggleSort('week')} className="cursor-pointer p-2 border">Tuần</th>
            <th onClick={() => toggleSort('status')} className="cursor-pointer p-2 border">Trạng thái</th>
            <th className="p-2 border">Tiến độ</th>
            <th className="p-2 border">Ngày</th>
            <th onClick={() => toggleSort('fail')} className="cursor-pointer p-2 border">Lỗi</th>
            <th onClick={() => toggleSort('signature')} className="cursor-pointer p-2 border">Chữ ký</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map(c => (
            <tr
              key={c.id}
              className={`
                border-t hover:bg-gray-50
                ${c.failCount > 0 ? 'bg-red-50' : ''}
                ${c.unsignedSupervisorCount > 0 ? 'bg-orange-50' : ''}
              `}
            >

              <td className="p-2 border font-medium">
                <Link href={`/checklist/${c.id}`}>
                  {c.forklift_number}
                </Link>
              </td>

              <td className="p-2 border">
                {c.week_number}/{c.year}
              </td>

              <td className="p-2 border">
                {c.status}
              </td>

              <td className="p-2 border">
                {c.percent}% ({c.daysArray.length}/7)
              </td>

              <td className="p-2 border text-xs">
                {c.daysArray.map((d: string) => {
                  const isFail = c.failSet.includes(d)
                  return (
                    <span
                      key={d}
                      className={`mr-1 px-1.5 py-0.5 rounded ${
                        isFail
                          ? 'bg-red-100 text-red-600 font-medium'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {d}
                    </span>
                  )
                })}
              </td>

              <td className="p-2 border text-center">
                {c.failCount > 0
                  ? <span className="text-red-600 font-bold">⚠ {c.failCount}</span>
                  : <span className="text-green-600">OK</span>
                }
              </td>

              <td className="p-2 border text-xs">
                {c.unsignedSupervisorCount > 0
                  ? <span className="text-orange-600">
                      ⚠ Supervisor ({c.unsignedSupervisorCount})
                    </span>
                  : <span className="text-green-600">✅</span>
                }
              </td>

            </tr>
          ))}
        </tbody>

      </table>

    </div>
  )
}
