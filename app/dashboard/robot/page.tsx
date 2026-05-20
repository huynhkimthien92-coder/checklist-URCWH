'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { getDaysInMonth } from '@/lib/robot-checklist-data'

export default function RobotDashboardPage() {

  const [data, setData] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] =
    useState<'robot' | 'month' | 'status' | 'fail' | 'signature'>('month')
  const [sortAsc, setSortAsc] = useState(false)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // ================= FETCH =================
  useEffect(() => {
    supabase
      .from('robot_checklists')
      .select('*')
      .then(({ data }) => {
        console.log('ROBOT DATA:', data)
        setData(data || [])
        setLoading(false)
      })
  }, [])

  // ================= PROCESS =================
  useEffect(() => {

    const STATUS_ORDER: Record<string, number> = {
      submitted: 0,
      approved: 1,
      draft: 2
    }

    let result = (data || []).map(c => {

      // ===== parse items =====
      let items: any[] = []
      try {
        items = Array.isArray(c.items)
          ? c.items
          : JSON.parse(c.items || '[]')
      } catch {}

      // ===== signatures =====
      let opSigns: any = {}
      let supSigns: any = {}

      try {
        opSigns = typeof c.operator_signatures === 'string'
          ? JSON.parse(c.operator_signatures || '{}')
          : c.operator_signatures || {}
      } catch {}

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

          if (status === 'pass' || status === 'fail') {
            daysSet.add(day)
          }

          if (status === 'fail') {
            failSet.add(day)
          }
        })
      })

      const daysArray = Array.from(daysSet).sort(
        (a, b) => Number(a) - Number(b)
      )

      const totalDays = getDaysInMonth(c.month, c.year)

      const percent = Math.round(
        (daysArray.length / totalDays) * 100
      )

      // ===== signature logic =====
      const unsignedOperator = daysArray.filter(
        d => !opSigns?.[d]?.data_url
      )

      const unsignedSupervisor = daysArray.filter(
        d => !supSigns?.[d]?.data_url
      )

      // ✅ signature score (để sort)
      let signatureScore = 0

      if (unsignedSupervisor.length > 0) {
        signatureScore = 0
      } else if (unsignedOperator.length > 0) {
        signatureScore = 1
      } else {
        signatureScore = 2
      }

      return {
        ...c,
        daysArray,
        failSet: Array.from(failSet),
        failCount: failSet.size,
        percent,
        totalDays,
        unsignedOperatorCount: unsignedOperator.length,
        unsignedSupervisorCount: unsignedSupervisor.length,
        signatureScore,
        statusOrder: STATUS_ORDER[c.status] ?? 99
      }
    })

    // ===== FILTER =====
    if (search) {
      result = result.filter(c =>
        c.robot_number?.toLowerCase().includes(search.toLowerCase())
      )
    }

    // ===== SORT =====
    result.sort((a, b) => {

      let aVal: any
      let bVal: any

      if (sortKey === 'robot') {
        aVal = a.robot_number || ''
        bVal = b.robot_number || ''
      }
      else if (sortKey === 'month') {
        aVal = a.month
        bVal = b.month
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

      <h1 className="text-xl font-bold">
        📊 Robot Checklist Dashboard
      </h1>

      {/* FILTER */}
      <input
        placeholder="🔍 Tìm theo robot..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border px-3 py-1 rounded text-sm"
      />

      <table className="w-full border text-sm bg-white">

        <thead className="bg-slate-100">
          <tr>
            <th onClick={() => toggleSort('robot')} className="p-2 border cursor-pointer">
              Robot
            </th>
            <th onClick={() => toggleSort('month')} className="p-2 border cursor-pointer">
              Tháng
            </th>
            <th onClick={() => toggleSort('status')} className="p-2 border cursor-pointer">
              Trạng thái
            </th>
            <th className="p-2 border">Tiến độ</th>
            <th className="p-2 border">Ngày</th>
            <th onClick={() => toggleSort('fail')} className="p-2 border cursor-pointer">
              Lỗi
            </th>
            <th onClick={() => toggleSort('signature')} className="p-2 border cursor-pointer">
              Chữ ký
            </th>
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
                <Link href={`/robot-checklist/${c.id}`}>
                  {c.robot_number}
                </Link>
              </td>

              <td className="p-2 border">
                {c.month}/{c.year}
              </td>

              <td className="p-2 border">
                {c.status}
              </td>

              <td className="p-2 border">
                {c.percent}% ({c.daysArray.length}/{c.totalDays})
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
