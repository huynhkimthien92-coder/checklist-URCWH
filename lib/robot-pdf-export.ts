// lib/robot-pdf-export.ts// lib/ const runtime = 'nodejs'

import { readFileSync } from 'fs'
import { join } from 'path'
import { RobotChecklist, getDaysInMonth } from './robot-checklist-data'

// ===================== BROWSER =====================
let browserInstance: any = null

async function getBrowser() {
  if (browserInstance) return browserInstance

  const puppeteer = (await import('puppeteer-core')).default
  const chromium = (await import('@sparticuz/chromium')).default

  browserInstance = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  })

  return browserInstance
}

// ===================== UTILS =====================
function getLogoBase64(): string {
  try {
    const buf = readFileSync(join(process.cwd(), 'public', 'logo.png'))
    return `data:image/png;base64,${buf.toString('base64')}`
  } catch {
    return ''
  }
}

function escapeHtml(text: string): string {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// ===================== MAIN =====================
export async function generateRobotPDFReport(
  checklist: RobotChecklist
): Promise<Buffer> {

  const daysCount = getDaysInMonth(checklist.month, checklist.year)
  const days = Array.from({ length: daysCount }, (_, i) => i + 1)
  const logoBase64 = getLogoBase64()

  // ✅ group category
  const categories = Array.from(
    new Set(checklist.items.map(i => i.category))
  )

  // ===================== BUILD TABLE =====================
  let tableRows = ''
  let index = 1

  for (const cat of categories) {
    const items = checklist.items.filter(i => i.category === cat)

    items.forEach((item, idx) => {

      // ✅ cells theo ngày
      const cells = days.map(d => {
        const entry = item.days?.[String(d)]

        const status = entry?.status || ''

        const bg =
          status === 'pass' ? '#f0fdf4' :
          status === 'fail' ? '#fff1f2' :
          'white'

        const text =
          status === 'pass' ? '✓' :
          status === 'fail' ? '✗' :
          ''

        const color =
          status === 'pass' ? '#166534' :
          status === 'fail' ? '#991b1b' :
          '#000'

        return `
          <td style="<td style;
            text-align:center;
            background:${bg};
            color:${color};
            font-weight:bold;
            font-size:8px;
            padding:1px;
          ">
            ${text}
          </td>
        `
      }).join('')

      const catCell =
        idx === 0
          ? `<td rowspan="${items.length}" style="
              writing-mode:vertical-rl;
              transform:rotate(180deg);
              background:#1a3a6b;
              color:#fff;
              font-size:7px;
              text-align:center;
              padding:2px;
            ">
              ${escapeHtml(cat)}
            </td>`
          : ''

      tableRows += `
        <tr>
          <td style="text-align:center;font-size:8px">${index}</td>
          ${catCell}
          <td style="font-size:7px;padding:2px">
            ${escapeHtml(item.label_vi)}
          </td>
          ${cells}
        </tr>
      `

      index++
    })
  }

  // ===================== SIGNATURE =====================
  const opSig = days.map(d => {
    const sig = checklist.operator_signatures?.[String(d)]?.data_url
    return `<td>${sig ? `<img src="${sig}" style="<img src="${:18px; max-height:20px; object-fit:contain; "/>` : ''}</td>`
  }).join('')

  const supSig = days.map(d => {
    const sig = checklist.supervisor_signatures?.[String(d)]?.data_url
    return `<td>${sig ? `<img src="${sig}" style="<img src="${:18px; max-height:20px; object-fit:contain; "/>` : ''}</td>`
  }).join('')

  // ===================== HTML =====================
  const html = `
  <html>
  <head>
    <meta charset="utf-8"/>
    <style>
      body { font-family: Arial; font-size:8px; }
      table { border-collapse: collapse; width:100%; table-layout: fixed;}
      td, th { border:1px solid #ccc; }
      th { background:#1a3a6b; color:white; }
    </style>
  </head>

  <body>
    <!-- HEADER -->
    <table style="margin-bottom:6px;border:none">
      <tr>
        <td style="border:none;width:100px">
          ${logoBase64 ? `<img src="${logoBase64}" style="width:80px"/>` : ''}
        </td>

        <td style="border:none;text-align:center">
          <h3>DANH SÁCH KIỂM TRA ROBOT</h3>
          <p>Robot Checklist</p>
        </td>

        <td style="border:none;text-align:right;font-size:7px">
          <div>Robot: ${escapeHtml(checklist.robot_number)}</div>
          <div>Tháng: ${checklist.month}/${checklist.year}</div>
        </td>
      </tr>
    </table>

    <!-- TABLE -->
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Nhóm</th>
          <th>Công việc</th>
          ${days.map(d => `<th>${days.map(dpx;text-align:center">
              ${d}
            </th>
          `).join('')}

        </tr>
      </thead>

      <tbody>
        ${tableRows}

        <!-- OPERATOR -->
        <tr>
          <td colspan="3">Operator</td>
          ${opSig}
        </tr>

        <!-- SUPERVISOR -->
        <tr>
          <td colspan="3">Supervisor</td>
          ${supSig}
        </tr>
      </tbody>
    </table>

    <!-- NOTES -->
    <div style="margin-top:10px">
      <strong>Ghi chú:</strong>
      ${escapeHtml(checklist.notes || '')}
    </div>

  </body>
  </html>
  `

  // ===================== RENDER =====================
  const browser = await getBrowser()
  const page = await browser.newPage()

  await page.setViewport({ width: 1400, height: 900 })
  await page.setContent(html, { waitUntil: 'networkidle0' })

  const pdf = await page.pdf({
    format: 'A4',
    landscape: true,
    printBackground: true,
    scale: 0.8,
    margin: { top: '5mm', bottom: '5mm', left: '5mm', right: '5mm' }
  })

  await page.close()

  return Buffer.from(pdf)
}
