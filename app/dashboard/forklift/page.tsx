// app/dashboard/forklift/page.tsx// app/dashboard createServiceClient } from '@/lib/supabase'
import { createServiceClient } from '@/lib/supabase'
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
            <th className="p-2 border">Ngày có data</th>
            <th className="p-2 border">Chưa ký</th>
          </tr>
        </thead>

        <tbody>
          {data?.map((c) => {

            const items = Array.isArray(c.items)
              ? c.items
              : JSON.parse(c.items || '[]')

            // ✅ map thứ → index (mon → sun)
            const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

            const daysWithData = new Set<string>()

            items.forEach((item: any) => {
              Object.entries(item.days || {}).forEach(([day, v]: any) => {
                if (
                  DAYS.includes(day) &&
                  (v?.status === 'pass' || v?.status === 'fail')
                ) {
                  daysWithData.add(day)
                }
              })
            })

            const daysArray = Array.from(daysWithData)

            // ✅ check unsigned operator
            const unsigned = daysArray.filter(
              d => !c.operator_signatures?.[d]?.data_url
            )

            const percent =
              DAYS.length > 0
                ? Math.round((daysArray.length / DAYS.length) * 100)
                : 0

            return (
              <tr key={c.id} className="border-t">

                {/* Forklift */}
                <td className="p-2 border font-medium">
                  {c.forklift_number}
                </td>

                {/* Week */}
                <td className="p-2 border">
                  {c.week_number}/{c.year}
                </td>

                {/* Status */}
                <td className="p-2 border">
                  <span className={
                    c.status === 'approved' ? 'text-green-600 font-bold' :
                    c.status === 'submitted' ? 'text-blue-600' :
                    'text-gray-500'
                  }>
                    {c.status}
                  </span>
                </td>

                {/* Progress */}
                <td className="p-2 border">
                  <div className="w-full bg-gray-200 h-2 rounded">
                    <div
                      className="bg-blue-500 h-2 rounded"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="text-xs mt-1">
                    {percent}% ({daysArray.length}/7 ngày)
                  </div>
                </td>

                {/* Days */}
                <td className="p-2 border text-xs">
                  {daysArray.length > 0
                    ? daysArray.join(', ')
                    : '-'}
                </td>

                {/* Unsigned */}
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

