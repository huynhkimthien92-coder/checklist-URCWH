// lib/robot-pdf-export.ts
export const runtime = 'nodejs'
import { readFileSync } from 'fs'
import { join } from 'path'
import { RobotChecklist, getDaysInMonth } from './robot-checklist-data'

let browserInstance: any = null

async function getBrowser() {
  if (browserInstance) return browserInstance
  try {
    const puppeteer = (await import('puppeteer-core')).default
    const chromium  = (await import('@sparticuz/chromium')).default
    browserInstance = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    })
    return browserInstance
  } catch (error) {
    throw new Error('Browser initialization failed')
  }
}

function getLogoBase64(): string {
  try {
    const buf = readFileSync(join(process.cwd(), 'public', 'logo.png'))
    return `data:image/png;base64,${buf.toString('base64')}`
  } catch { return '' }
}

function escapeHtml(text: string): string {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

const MONTH_VI = ['', 'Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
  'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12']

export async function generateRobotPDFReport(checklist: RobotChecklist): Promise<Buffer> {
  const daysCount = getDaysInMonth(checklist.month, checklist.year)
  const days = Array.from({ length: daysCount }, (_, i) => i + 1)
  const logoBase64 = getLogoBase64()

  // Group items by category
  const categories = Array.from(new Set(checklist.items.map(i => i.category)))

  // Build table rows
  let tableRows = ''
  let itemIndex = 1
  for (const cat of categories) {
    const catItems = checklist.items.filter(i => i.category === cat)
    tableRows += catItems.map((item, idx) => {
      const cells = days.map(d => {
        const entry = checklist.day_entries?.[String(d)]?.[item.id]
        const status = entry?.status || ''
        const bg = status === 'pass' ? '#f0fdf4' : status === 'fail' ? '#fff1f2' : 'white'
        const symbol = status === 'pass' ? 'V' : status === 'fail' ? 'X' : ''
        const color = status === 'pass' ? '#166534' : '#991b1b'
        return `<td style="text-align:center;background:${bg};color:${color};font-weight:bold;font-size:8px;padding:1px;">${symbol}</td>`
      }).join('')

      const rowSpan = idx === 0 ? ` rowspan="${catItems.length}"` : ''
      const catCell = idx === 0
        ? `<td${rowSpan} style="background:#1a3a6b;color:white;font-weight:bold;text-align:center;writing-mode:vertical-rl;transform:rotate(180deg);font-size:7px;padding:2px;width:16px;">${escapeHtml(cat)}</td>`
        : ''

      const tr = `<tr>
        <td style="text-align:center;font-size:8px;padding:1px 2px;width:16px;">${itemIndex}</td>
        ${catCell}
        <td style="font-size:7px;padding:2px 3px;">${escapeHtml(item.label_vi)}</td>
        ${cells}
      </tr>`
      itemIndex++
      return tr
    }).join('')
  }

  // Operator signature row
  const opSigCells = days.map(d => {
    const sig = checklist.operator_signatures?.[String(d)]?.data_url
    return `<td style="text-align:center;padding:1px;height:30px;">${sig ? `<img src="${sig}" style="height:25px;max-width:100%;object-fit:contain;" />` : ''}</td>`
  }).join('')

  // Supervisor signature row
  const supSigCells = days.map(d => {
    const sig = checklist.supervisor_signatures?.[String(d)]?.data_url
    return `<td style="text-align:center;padding:1px;height:30px;">${sig ? `<img src="${sig}" style="height:25px;max-width:100%;object-fit:contain;" />` : ''}</td>`
  }).join('')

  // Incident table
  const incidents = checklist.incidents || []
  const incidentRows = incidents.length > 0
    ? incidents.map(inc => `
        <tr>
          <td style="padding:2px 4px;font-size:7px;">${escapeHtml(inc.incident)}</td>
          <td style="padding:2px 4px;font-size:7px;width:60px;">${escapeHtml(inc.date)}</td>
          <td style="padding:2px 4px;font-size:7px;width:80px;">${escapeHtml(inc.receiver)}</td>
        </tr>`).join('')
    : `<tr><td colspan="3" style="padding:6px;font-size:7px;color:#94a3b8;">Không có sự cố</td></tr>`

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; font-size:8px; color:#0f172a; background:white; }
    table { border-collapse:collapse; width:100%; }
    th, td { border:0.5px solid #94a3b8; }
    th { background:#1a3a6b; color:white; font-size:7px; padding:2px; font-weight:bold; }
    .page { padding:5mm; }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <table style="margin-bottom:6px;border:none;">
    <tr>
      <td style="border:none;width:100px;">
        ${logoBase64 ? `<img src="${logoBase64}" style="width:90px;height:auto;" />` : ''}
      </td>
      <td style="border:none;text-align:center;">
        <div style="font-size:13px;font-weight:bold;color:#1a3a6b;">
          DANH SÁCH CÔNG VIỆC CẦN BẢO TRÌ – HÀNG NGÀY
        </div>
        <div style="font-size:10px;color:#334155;font-style:italic;">
          Daily AM Checklist
        </div>
      </td>
      <td style="border:none;width:130px;font-size:7px;text-align:right;">
        <div>Revision date: 20/09/2025</div>
        <div>Document No: WH-SOP08-FR01</div>
      </td>
    </tr>
  </table>

  <!-- Info row -->
  <table style="margin-bottom:4px;font-size:8px;">
    <tr>
      <td style="padding:3px;background:#f5f5f5;font-weight:bold;width:100px;">Thời gian kiểm tra:</td>
      <td style="padding:3px;">Trước khi Vận hành hệ thống/Máy</td>
      <td style="padding:3px;background:#f5f5f5;font-weight:bold;width:60px;">Area:</td>
      <td style="padding:3px;width:80px;">${escapeHtml(checklist.area || 'MROBOT')}</td>
      <td style="padding:3px;background:#f5f5f5;font-weight:bold;width:70px;">Robot số:</td>
      <td style="padding:3px;">${escapeHtml(checklist.robot_number)}</td>
      <td style="padding:3px;background:#f5f5f5;font-weight:bold;width:60px;">Tháng/Năm:</td>
      <td style="padding:3px;">${MONTH_VI[checklist.month]}/${checklist.year}</td>
    </tr>
  </table>

  <!-- Main checklist table -->
  <table style="margin-bottom:4px;table-layout:fixed;">
    <colgroup>
      <col style="width:16px"/>  <!-- # -->
      <col style="width:16px"/>  <!-- Nhóm -->
      <col style="width:160px"/> <!-- Công việc -->
      ${days.map(() => '<col style="width:18px"/>').join('')}
    </colgroup>
    <thead>
      <tr>
        <th rowspan="2" style="width:16px;">#</th>
        <th rowspan="2" style="width:16px;">Nhóm</th>
        <th rowspan="2">Công việc / Task</th>
        ${days.map(d => `<th style="font-size:7px;padding:1px;">${d}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${tableRows}
      <!-- Nhân viên vận hành -->
      <tr>
        <td colspan="3" style="text-align:center;background:#1a3a6b;color:white;font-weight:bold;font-size:8px;padding:2px;">
          Nhân viên vận hành
        </td>
        ${opSigCells}
      </tr>
      <!-- Tổ trưởng -->
      <tr>
        <td colspan="3" style="text-align:center;background:#1a3a6b;color:white;font-weight:bold;font-size:8px;padding:2px;">
          Tổ trưởng
        </td>
        ${supSigCells}
      </tr>
    </tbody>
  </table>

  <!-- Ghi nhận sự cố -->
  <div style="font-size:8px;font-weight:bold;color:#1a3a6b;margin-bottom:2px;">
    Ghi nhận sự cố máy:
  </div>
  <table style="margin-bottom:4px;">
    <thead>
      <tr>
        <th style="text-align:left;padding:2px 4px;">Sự cố</th>
        <th style="width:60px;">Ngày</th>
        <th style="width:80px;">Người nhận</th>
      </tr>
    </thead>
    <tbody>${incidentRows}</tbody>
  </table>

  <!-- Ghi chú -->
  <div style="border:0.5px solid #e2e8f0;padding:4px;font-size:7px;min-height:20px;">
    <strong>Ghi chú:</strong> ${escapeHtml(checklist.notes || '')}
  </div>

</div>
</body>
</html>`

  const browser = await getBrowser()
  const page = await browser.newPage()
  await page.setViewport({ width: 1400, height: 900 })
  await page.setContent(html, { waitUntil: 'networkidle0' })

  const pdfBuffer = await page.pdf({
    format: 'A4',
    landscape: true,     // Landscape vì có 31 cột ngày
    printBackground: true,
    scale: 0.85,
    margin: { top: '5mm', right: '5mm', bottom: '5mm', left: '5mm' },
    displayHeaderFooter: false,
  })

  await page.close().catch(() => {})
  return Buffer.from(pdfBuffer)
}
