// app/dashboard/robot/page.tsx

import { createServiceClient } from '@/lib/supabase'
import { getDaysInMonth } from '@/lib/robot-checklist-data'

export const dynamic = 'force-dynamic'

// ======================= PAGE =======================
export default async function RobotDashboardPage() {

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('robot_checklists')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return <div className="p-4 text-red-500">Load error</div>
  }

  return (
    <div className="p-4 space-y-4">

      <h1 className="text-xl font-bold">
        📊 Robot Checklist Dashboard
      </h1>

      <table className="w-full border text-sm">
        <thead className="bg-slate-100">
          <tr>
            <th className="p-2 border">Robot</th>
            <th className="p-2 border">Tháng</th>
            <th className="p-2 border">Trạng thái</th>
            <th className="p-2 border">Tiến độ</th>
            <th className="p-2 border">Ngày có data</th>
            <th className="p-2 border">Chưa ký</th>
          </tr>
        </thead>

        <tbody>
          {data?.map((c) => {

            const items = c.items || []

            // ✅ lấy ngày có data
            const daysWithData = new Set<string>()

            items.forEach((item: any) => {
              Object.entries(item.days || {}).forEach(([day, v]: any) => {
                if (v?.status === 'pass' || v?.status === 'fail') {
                  daysWithData.add(day)
                }
              })
            })

            const daysArray = Array.from(daysWithData)

            // ✅ check unsigned (operator)
            const unsigned = daysArray.filter(
              day => !c.operator_signatures?.[day]?.data_url
            )

            // ✅ progress %
            const totalDays = getDaysInMonth(c.month, c.year)
            const percent =
              totalDays > 0
                ? Math.round((daysArray.length / totalDays) * 100)
                : 0

            return (
              <tr key={c.id} className="border-t">

                {/* ROBOT */}
                <td className="p-2 border font-medium">
                  {c.robot_number}
                </td>

                {/* TIME */}
                <td className="p-2 border">
                  {c.month}/{c.year}
                </td>

                {/* STATUS */}
                <td className="p-2 border">
                  <span className={
                    c.status === 'approved' ? 'text-green-600 font-bold' :
                    c.status === 'submitted' ? 'text-blue-600' :
                    'text-gray-500'
                  }>
                    {c.status}
                  </span>
                </td>

                {/* PROGRESS */}
                <td className="p-2 border">
                  <div className="w-full bg-gray-200 h-2 rounded">
                    <div
                      className="bg-blue-500 h-2 rounded"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="text-xs mt-1">
                    {percent}% ({daysArray.length}/{totalDays} ngày)
                  </div>
                </td>

                {/* DAYS WITH DATA */}
                <td className="p-2 border text-xs">
                  {daysArray.length > 0
                    ? daysArray.join(', ')
                    : '-'}
                </td>

                {/* UNSIGNED */}
                <td className="p-2 border text-xs text-red-600">
                  {unsigned.length > 0
                    ? unsigned.join(', ')
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
