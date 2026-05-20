'use client'

import { useEffect, useState } from 'react'
import { createServiceClient } from '@/lib/supabase'
import Link from 'next/link'

export default function ForkliftDashboardPage() {

  const [data, setData] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string>('created_at')
  const [sortAsc, setSortAsc] = useState<boolean>(false)

  const supabase = createServiceClient()

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

  // ================= SORT + FILTER =================
  useEffect(() => {

    const DAYS = ['mon','tue','wed','thu','fri','sat','sun']

    let result = (data || []).map(c => {

      // parse items
      let items: any[] = []
      try {
        items = Array.isArray(c.items)
          ? c.items
          : JSON.parse(c.items || '[]')
      } catch {}

      let opSigns: any = {}
      try {
        opSigns = typeof c.operator_signatures === 'string'
          ? JSON.parse(c.operator_signatures || '{}')
          : c.operator_signatures || {}
      } catch {}

      let supSigns: any = {}
      try {
        supSigns = typeof c.supervisor_signatures === 'string'
          ? JSON.parse(c.supervisor_signatures || '{}')
          : c.supervisor_signatures || {}
      } catch {}

      const daysSet = new Set<string>()
      const failSet = new Set<string>()

      items.forEach((item: any) => {
        const days = typeof item.days === 'object' ? item.days : {}

        Object.entries(days).forEach(([day, entry]: any) => {
          const status = typeof entry === 'string' ? entry : entry?.status

          if (DAYS.includes(day) && (status === 'pass' || status === 'fail')) {
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

      return {
        ...c,
        daysArray,
        failCount: failSet.size,
        unsignedSupervisorCount: unsignedSupervisor.length
      }
    })

    // ===== FILTER
    if (search) {
      result = result.filter(c =>
        c.forklift_number?.toLowerCase().includes(search.toLowerCase())
      )
    }

    // ===== SORT
    result.sort((a, b) => {

      let aVal = a[sortKey]
      let bVal = b[sortKey]

      if (sortKey === 'week') {
        aVal = a.week_number
        bVal = b.week_number
      }

      if (sortKey === 'failCount') {
        aVal = a.failCount
        bVal = b.failCount
      }

      if (sortKey === 'forklift_number') {
        aVal = a.forklift_number || ''
        bVal = b.forklift_number || ''
      }

      if (aVal < bVal) return sortAsc ? -1 : 1
      if (aVal > bVal) return sortAsc ? 1 : -1
      return 0
    })

    setFiltered(result)

  }, [data, search, sortKey, sortAsc])

  // ================= UI =================

  const toggleSort = (key: string) => {
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

      <h1 className="text-xl font-bold">
        📊 Forklift Checklist Dashboard
      </h1>

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
            <th onClick={() => toggleSort('forklift_number')} className="p-2 border cursor-pointer">
              Xe
            </th>
            <th onClick={() => toggleSort('week')} className="p-2 border cursor-pointer">
              Tuần
            </th>
            <th className="p-2 border">Trạng thái</th>
            <th className="p-2 border">Tiến độ</th>
            <th className="p-2 border">Ngày</th>
            <th onClick={() => toggleSort('failCount')} className="p-2 border cursor-pointer">
              Lỗi
            </th>
            <th className="p-2 border">Chữ ký</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map(c => {

            return (
              <tr key={c.id} className="border-t hover:bg-gray-50">

                <td className="p-2 border font-medium">
                  <Link href={`/checklist/${c.id}`}>{c.forklift_number}</Link>
                </td>

                <td className="p-2 border">
                  {c.week_number}/{c.year}
                </td>

                <td className="p-2 border">
                  {c.status}
                </td>

                <td className="p-2 border">
                  {c.daysArray.length}/7
                </td>

                <td className="p-2 border text-xs">
                  {c.daysArray.join(', ')}
                </td>

                <td className="p-2 border text-center">
                  {c.failCount}
                </td>

                <td className="p-2 border text-xs">
                  {c.unsignedSupervisorCount > 0
                    ? `⚠ ${c.unsignedSupervisorCount}`
                    : '✅'}
                </td>

              </tr>
            )
          })}
        </tbody>

      </table>

    </div>
  )
}
