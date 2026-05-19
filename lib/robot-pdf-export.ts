export const runtime = 'nodejs'

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

  // ===== GROUP CATEGORY =====
  const categories = Array.from(
    new Set(checklist.items.map(i => i.category))
  )

  // ===================== BUILD TABLE =====================
  let tableRows = ''
  let index = 1

  for (const cat of categories) {
    const items = checklist.items.filter(i => i.category === cat)

    items.forEach((item, idx) => {

      const cells = days.map(d => {
        const entry = item.days?.[String(d)]
        const status = entry?.status || ''

        const bg =
          status === 'pass' ? '#dcfce7' :
          status === 'fail' ? '#fee2e2' :
          'white'

        const symbol =
          status === 'pass' ? '✓' :
          status === 'fail' ? '✗' : ''

        return `
          <td style="
            width:28px;
            text-align:center;
            background:${bg};
            font-size:9px;
            font-weight:bold;
          ">
            ${symbol}
          </td>
        `
      }).join('')

      const catCell =
        idx === 0
          ? `<td rowspan="${items.length}" style="
              width:60px;
              writing-mode:vertical-rl;
              transform:rotate(180deg);
              background:#1a3a6b;
              color:#fff;
              font-size:9px;
              text-align:center;
            ">
              ${escapeHtml(cat)}
            </td>`
          : ''

      tableRows += `
        <tr>
          <td style="width:30px;text-align:center;font-size:8px;">
            ${index}
          </td>

          ${catCell}

          <td style="
            width:260px;
            font-size:9px;
            padding:2px;
          ">
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

    return `
      <td style="width:28px;text-align:center;">
        ${sig ? `<img src="${sig}" style="max-width:24px;max-height:24px;" />` : ''}
      </td>
    `
  }).join('')

  const supSig = days.map(d => {
    const sig = checklist.supervisor_signatures?.[String(d)]?.data_url

    return `
      <td style="width:28px;text-align:center;">
        ${sig ? `<img src="${sig}" style="max-width:24px;max-height:24px;" />` : ''}
      </td>
    `
  }).join('')

  // ===================== HTML =====================
  const html = `
  <html>
  <head>
    <meta charset="utf-8"/>
    <style>
      body {
        font-family: Arial, sans-serif;
        font-size:10px;
      }

      table {
        width:100%;
        border-collapse: collapse;
        table-layout: fixed; /* ✅ cực quan trọng */
      }

      th, td {
        border:1px solid #ccc;
      }

      th {
        background:#1a3a6b;
        color:#fff;
        font-size:9px;
      }
    </style>
  </head>

  <body>

    <!-- HEADER -->
    <table style="border:none;margin-bottom:6px">
      <tr>
        <td style="border:none;width:100px">
          ${logoBase64 ? `<img src="${logoBase64}" style="width:80px"/>` : ''}
        </td>

        <td style="border:none;text-align:center">
          <h3>DANH SÁCH KIỂM TRA ROBOT</h3>
          <p>Robot Checklist</p>
        </td>

        <td style="border:none;text-align:right;font-size:8px">
          <div>Robot: ${escapeHtml(checklist.robot_number)}</div>
          <div>${checklist.month}/${checklist.year}</div>
        </td>
      </tr>
    </table>

    <!-- TABLE -->
    <table>
      <thead>
        <tr>
          <th style="width:30px">#</th>
          <th style="width:60px">Nhóm</th>
          <th style="width:260px">Công việc</th>
          ${days.map(d => `
            <th style="width:28px">
              ${d}
            </th>
          `).join('')}
        </tr>
      </thead>

      <tbody>

        ${tableRows}

        <tr>
          <td colspan="3">Operator</td>
          ${opSig}
        </tr>

        <tr>
          <td colspan="3">Supervisor</td>
          ${supSig}
        </tr>

      </tbody>
    </table>

    <div style="margin-top:10px">
      <b>Ghi chú:</b>
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
    scale: 1,  // ✅ FIX font nhỏ
    margin: {
      top: '5mm',
      bottom: '5mm',
      left: '5mm',
      right: '5mm'
    }
  })

  await page.close()

  return Buffer.from(pdf)
}
