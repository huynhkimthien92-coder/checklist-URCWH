// app/dashboard/forklift/page.tsx

import { createServiceClient } from '@/lib/supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

// ======================= PAGE =======================
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
    <div className="p-4 space-y-4">

      <h1 className="text-xl font-bold">
        📊 Forklift Checklist Dashboard
      </h1>

      <table className="w-full border text-sm">
        <thead className="bg-slate-100">
          <tr>
            <th className="p-2 border">Xe</th>
            <th className="p-2 border">Tuần</th>
            <th className="p-2 border">Trạng thái</th>
            <th className="p-2 border">Tiến độ</th>
            <th className="p-2 border">Ngày</th>
            <th className="p-2 border">Lỗi</th>
            <th className="p-2 border">Chưa ký</th>
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

              // ✅ SAFE PARSE signatures
              const opSigns = (() => {
                try {
                  return typeof c.operator_signatures === 'string'
                    ? JSON.parse(c.operator_signatures || '{}')
                    : c.operator_signatures || {}
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

              const unsigned = daysArray.filter(
                d => !opSigns?.[d]?.data_url
              )

              const percent =
                DAYS.length > 0
                  ? Math.round((daysArray.length / DAYS.length) * 100)
                  : 0

              return (
                <tr
                  key={c.id}
                  className={`
                    relative border-t group
                    ${failSet.size > 0 ? 'bg-red-50' : ''}
                    hover:bg-gray-50
                  `}
                >

                  {/* ✅ CLICK OVERLAY */}
                  <td colSpan={7} className="absolute inset-0 z-10">
                    <Link
                      href={`/checklist/${c.id}`}
                      className="block w-full h-full"
                    />
                  </td>

                  {/* CONTENT */}
                  <td className="p-2 border relative z-20 font-medium">
                    {c.forklift_number}
                  </td>

                  <td className="p-2 border relative z-20">
                    {c.week_number}/{c.year}
                  </td>

                  <td className="p-2 border relative z-20">
                    <span className={
                      c.status === 'approved'
                        ? 'text-green-600 font-bold'
                        : c.status === 'submitted'
                        ? 'text-blue-600'
                        : 'text-gray-500'
                    }>
                      {c.status}
                    </span>
                  </td>

                  <td className="p-2 border relative z-20">
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
                  </td>

                  <td className="p-2 border text-xs relative z-20">
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
                  </td>

                  <td className="p-2 border text-center relative z-20">
                    {failSet.size > 0
                      ? <span className="text-red-600 font-bold">⚠ {failSet.size}</span>
                      : <span className="text-green-600">OK</span>
                    }
                  </td>

                  <td className="p-2 border text-xs text-red-600 relative z-20">
                    {unsigned.length > 0
                      ? unsigned.join(', ')
                      : '✅'}
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
