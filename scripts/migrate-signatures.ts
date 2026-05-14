/**
 * scripts/migrate-signatures.ts
 *
 * Script chạy 1 lần để migrate chữ ký base64 đang lưu trong DB
 * → upload lên Cloudinary → thay thế bằng URL.
 *
 * Cách chạy:
 *   npx ts-node --project tsconfig.json scripts/migrate-signatures.ts
 *
 * Hoặc thêm vào package.json:
 *   "migrate:signatures": "ts-node scripts/migrate-signatures.ts"
 *
 * Yêu cầu env:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

// ── Cloudinary helper (inline vì không import từ lib/) ────────
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!
const API_KEY    = process.env.CLOUDINARY_API_KEY!
const API_SECRET = process.env.CLOUDINARY_API_SECRET!

const crypto = require('crypto')

function makeSignatureSync(params: Record<string, string>): string {
  const toSign =
    Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&') + API_SECRET
  return crypto.createHash('sha1').update(toSign).digest('hex')
}

async function uploadBase64(dataUrl: string, folder: string, publicId: string): Promise<string> {
  const timestamp = String(Math.round(Date.now() / 1000))
  const sigParams = { folder, public_id: publicId, timestamp }
  const signature = makeSignatureSync(sigParams)

  const form = new FormData()
  form.append('api_key', API_KEY)
  form.append('timestamp', timestamp)
  form.append('signature', signature)
  form.append('folder', folder)
  form.append('public_id', publicId)
  form.append('file', dataUrl)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  return data.secure_url
}
// ─────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

async function migrate() {
  console.log('📦 Fetching all checklists...')
  const { data: checklists, error } = await supabase
    .from('checklists')
    .select('id, operator_signatures, supervisor_signatures')

  if (error) throw error
  console.log(`Found ${checklists.length} checklists.`)

  let updatedCount = 0

  for (const cl of checklists) {
    const opSigs  = cl.operator_signatures  || {}
    const supSigs = cl.supervisor_signatures || {}
    let changed = false

    for (const day of DAYS) {
      // Operator signature
      if (opSigs[day]?.data_url?.startsWith('data:image/')) {
        console.log(`  ↑ ${cl.id} | operator | ${day}`)
        try {
          const url = await uploadBase64(
            opSigs[day].data_url,
            'checklist-signatures',
            `${cl.id}_${day}_operator`,
          )
          opSigs[day] = { ...opSigs[day], data_url: url }
          changed = true
          console.log(`  ✓ → ${url.slice(0, 60)}...`)
        } catch (e) {
          console.error(`  ✗ failed operator ${cl.id} ${day}:`, e)
        }
      }

      // Supervisor signature
      if (supSigs[day]?.data_url?.startsWith('data:image/')) {
        console.log(`  ↑ ${cl.id} | supervisor | ${day}`)
        try {
          const url = await uploadBase64(
            supSigs[day].data_url,
            'checklist-signatures',
            `${cl.id}_${day}_supervisor`,
          )
          supSigs[day] = { ...supSigs[day], data_url: url }
          changed = true
          console.log(`  ✓ → ${url.slice(0, 60)}...`)
        } catch (e) {
          console.error(`  ✗ failed supervisor ${cl.id} ${day}:`, e)
        }
      }
    }

    if (changed) {
      const { error: updateErr } = await supabase
        .from('checklists')
        .update({
          operator_signatures: opSigs,
          supervisor_signatures: supSigs,
        })
        .eq('id', cl.id)

      if (updateErr) {
        console.error(`  ✗ DB update failed for ${cl.id}:`, updateErr.message)
      } else {
        updatedCount++
        console.log(`  ✅ DB updated: ${cl.id}`)
      }
    }
  }

  console.log(`\n🎉 Migration done. ${updatedCount} checklists updated.`)
}

migrate().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
