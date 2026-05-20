'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

export default function ForkliftDashboardPage() {

  const [data, setData] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<'forklift' | 'week' | 'fail'>('week')
  const [sortAsc, setSortAsc] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

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
  }, [])

  // ================= PROCESS =================
  useEffect(() => {

    let result = (data || []).map(c => {

      // ===== parse items =====
      let items: any[] = []
      try {
        items = Array.isArray(c.items)
          ? c.items
          : JSON.parse(c.items || '[]')
      } catch {}

      // ===== parse signatures =====
      let supSigns: any = {}
      try {
        supSigns = typeof c.supervisor_signatures === 'string'
          ? JSON.parse(c.supervisor_signatures || '{}')
          : c.supervisor_signatures || {}
      } catch {}

      const daysSet = new Set<string>()
      const failSet = new Set<string>()

      items.forEach(item => {
        const days = typeof item.days === 'object' ? item.days : {}

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

      // ✅ sort ngày đúng thứ tự
      const daysArray = Array.from(daysSet).sort(
        (a, b) => DAYS.indexOf(a) - DAYS.indexOf(b)
      )

      const unsignedSupervisor = daysArray.filter(
        d => !supSigns?.[d]?.data_url
      )

      return {
        ...c,
        daysArray,
        failSet: Array.from(failSet),
        failCount: failSet.size,
        percent: Math.round((daysArray.length / 7) * 100),
        unsignedSupervisorCount: unsignedSupervisor.length
      }
    })

    // ===== FILTER =====
    if (search) {
      result = result.filter(c =>
        c.forklift_number?.toLowerCase().includes(search.toLowerCase())
      )
    }

    // ===== SORT =====
    result.sort((a, b) => {

      let aVal: any
      let bVal: any

      if (sortKey === 'forklift') {
        aVal = a.forklift_number || ''
        bVal = b.forklift_number || ''
      } else if (sortKey === 'week') {
        aVal = a.week_number
        bVal = b.week_number
      } else if (sortKey === 'fail') {
        aVal = a.failCount
        bVal = b.failCount
      }

      if (aVal < bVal) return sortAsc ? -1 : 1
      if (aVal > bVal) return sortAsc ? 1 : -1
      return 0
    })

    setFiltered(result)

  }, [data, search, sortKey, sortAsc])

  const toggleSort = (key: 'forklift' | 'week' | 'fail') => {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  if (loading) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <div className="space-y-4">

      <h1 className="text-xl font-bold">
        📊 Forklift Checklist Dashboard
      </h1>

      {/* 🔍 FILTER */}
      <input
        placeholder="🔍 Tìm theo xe..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border px-3 py-1 rounded text-sm"
      />

      <table className="w-full border text-sm bg-white">

        <thead className="bg-slate-100">
          <tr>
            <th onClick={() => toggleSort('forklift')} className="p-2 border cursor-pointer">
              Xe
            </th>
            <th onClick={() => toggleSort('week')} className="p-2 border cursor-pointer">
              Tuần
            </th>
            <th className="p-2 border">Trạng thái</th>
            <th className="p-2 border">Tiến độ</th>
            <th className="p-2 border">Ngày</th>
            <th onClick={() => toggleSort('fail')} className="p-2 border cursor-pointer">
              Lỗi
            </th>
            <th className="p-2 border">Chữ ký</th>
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

              {/* XE */}
              <td className="p-2 border font-medium">
                <Link href={`/checklist/${c.id}`}>
                  {c.forklift_number}
                </Link>
              </td>

              {/* TUẦN */}
              <td className="p-2 border">
                {c.week_number}/{c.year}
              </td>

              {/* STATUS */}
              <td className="p-2 border">
                {c.status}
              </td>

              {/* PROGRESS */}
              <td className="p-2 border">
                {c.percent}% ({c.daysArray.length}/7)
              </td>

              {/* DAYS ✅ highlight nhẹ */}
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

              {/* FAIL */}
              <td className="p-2 border text-center">
                {c.failCount > 0
                  ? <span className="text-red-600 font-bold">⚠ {c.failCount}</span>
                  : <span className="text-green-600">OK</span>
                }
              </td>

              {/* SIGNATURE */}
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
