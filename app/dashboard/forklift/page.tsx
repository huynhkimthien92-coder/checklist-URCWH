// app/dashboard/forklift/page.tsx

import { createServiceClient } from '@/lib/supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ForkliftDashboardPage() {

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('checklists')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return <div className="p-4 text-red-500">Load error</div>
  }

  return (
    <div className="space-y-4">

      <h1 className="text-xl font-bold">
        📊 Forklift Checklist Dashboard
      </h1>

      <table className="w-full border text-sm bg-white">
        <thead className="bg-slate-100">
          <tr>
            <th className="p-2 border">Xe</th>
            <th className="p-2 border">Tuần</th>
            <th className="p-2 border">Trạng thái</th>
            <th className="p-2 border">Tiến độ</th>
            <th className="p-2 border">Ngày</th>
            <th className="p-2 border">Lỗi</th>
            <th className="p-2 border">Chữ ký</th>
          </tr>
        </thead>

        <tbody>

          {data?.map((c) => {
            try {

              // ✅ SAFE PARSE items
              const items = (() => {
                try {
                  return Array.isArray(c.items)
                    ? c.items
                    : JSON.parse(c.items || '[]')
                } catch {
                  return []
                }
              })()

              // ✅ SAFE PARSE operator
              const opSigns = (() => {
                try {
                  return typeof c.operator_signatures === 'string'
                    ? JSON.parse(c.operator_signatures || '{}')
                    : c.operator_signatures || {}
                } catch {
                  return {}
                }
              })()

              // ✅ SAFE PARSE supervisor ✅ NEW
              const supSigns = (() => {
                try {
                  return typeof c.supervisor_signatures === 'string'
                    ? JSON.parse(c.supervisor_signatures || '{}')
                    : c.supervisor_signatures || {}
                } catch {
                  return {}
                }
              })()

              const DAYS = ['mon','tue','wed','thu','fri','sat','sun']

              const daysSet = new Set<string>()
              const failSet = new Set<string>()

              items.forEach((item: any) => {

                const days =
                  typeof item.days === 'object' && item.days !== null
                    ? item.days
                    : {}

                Object.entries(days).forEach(([day, entry]: any) => {

                  const status =
                    typeof entry === 'string'
                      ? entry
                      : entry?.status || ''

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

              const daysArray = Array.from(daysSet)

              // ✅ NEW: phân loại chữ ký
              const unsignedOperator = daysArray.filter(
                d => !opSigns?.[d]?.data_url
              )

              const unsignedSupervisor = daysArray.filter(
                d => !supSigns?.[d]?.data_url
              )

              const percent =
                Math.round((daysArray.length / DAYS.length) * 100)

              return (
                <tr
                  key={c.id}
                  className={`
                    border-t hover:bg-gray-50
                    ${failSet.size > 0 ? 'bg-red-50' : ''}
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
                    <Link href={`/checklist/${c.id}`}>
                      {c.week_number}/{c.year}
                    </Link>
                  </td>

                  {/* STATUS */}
                  <td className="p-2 border">
                    <Link href={`/checklist/${c.id}`}>
                      <span className={
                        c.status === 'approved'
                          ? 'text-green-600 font-bold'
                          : c.status === 'submitted'
                          ? 'text-blue-600'
                          : 'text-gray-500'
                      }>
                        {c.status}
                      </span>
                    </Link>
                  </td>

                  {/* PROGRESS */}
                  <td className="p-2 border">
                    <Link href={`/checklist/${c.id}`}>

                      <div className="w-full bg-gray-200 h-2 rounded">
                        <div
                          className={`
                            h-2 rounded
                            ${
                              percent === 100
                                ? 'bg-green-500'
                                : percent > 50
                                ? 'bg-blue-500'
                                : 'bg-yellow-500'
                            }
                          `}
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <div className="text-xs mt-1">
                        {percent}% ({daysArray.length}/7)
                      </div>

                    </Link>
                  </td>

                  {/* DAYS */}
                  <td className="p-2 border text-xs">
                    <Link href={`/checklist/${c.id}`}>
                      {daysArray.map(d => (
                        <span
                          key={d}
                          className={`mr-1 px-1 rounded ${
                            failSet.has(d)
                              ? 'bg-red-200 text-red-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {d}
                        </span>
                      ))}
                    </Link>
                  </td>

                  {/* FAIL */}
                  <td className="p-2 border text-center">
                    <Link href={`/checklist/${c.id}`}>
                      {failSet.size > 0
                        ? <span className="text-red-600 font-bold">⚠ {failSet.size}</span>
                        : <span className="text-green-600">OK</span>
                      }
                    </Link>
                  </td>

                  {/* ✅ SIGNATURE LOGIC MỚI */}
                  <td className="p-2 border text-xs">

                    <Link href={`/checklist/${c.id}`}>

                      {/* thiếu cả 2 */}
                      {unsignedOperator.length > 0 && unsignedSupervisor.length > 0 && (
                        <span className="text-red-600">
                          ❌ Op+Sup
                        </span>
                      )}

                      {/* thiếu supervisor */}
                      {unsignedOperator.length === 0 && unsignedSupervisor.length > 0 && (
                        <span className="text-orange-600 font-medium">
                          ⚠ Supervisor ({unsignedSupervisor.length})
                        </span>
                      )}

                      {/* thiếu operator */}
                      {unsignedOperator.length > 0 && unsignedSupervisor.length === 0 && (
                        <span className="text-blue-600">
                          ⏳ Operator ({unsignedOperator.length})
                        </span>
                      )}

                      {/* đủ */}
                      {unsignedOperator.length === 0 && unsignedSupervisor.length === 0 && (
                        <span className="text-green-600">✅</span>
                      )}

                    </Link>

                  </td>

                </tr>
              )

            } catch (err) {
              console.error('ROW ERROR:', err)
              return null
            }
          })}

        </tbody>
      </table>

    </div>
  )
}
