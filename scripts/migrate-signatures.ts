import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createHash } from 'crypto'

const envPath = resolve(process.cwd(), '.env.local')
try {
  const lines = readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
    if (!(key in process.env)) process.env[key] = val
  }
  console.log('Loaded .env.local')
} catch {
  console.log('No .env.local found, using existing env')
}

function makeSignatureSync(params: Record<string, string>): string {
  const API_SECRET = process.env.CLOUDINARY_API_SECRET!
  const toSign = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&') + API_SECRET
  return createHash('sha1').update(toSign).digest('hex')
}

async function uploadBase64(dataUrl: string, folder: string, publicId: string): Promise<string> {
  const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!
  const API_KEY    = process.env.CLOUDINARY_API_KEY!
  const timestamp  = String(Math.round(Date.now() / 1000))
  const sigParams  = { folder, public_id: publicId, timestamp }
  const signature  = makeSignatureSync(sigParams)
  const form = new FormData()
  form.append('api_key', API_KEY)
  form.append('timestamp', timestamp)
  form.append('signature', signature)
  form.append('folder', folder)
  form.append('public_id', publicId)
  form.append('file', dataUrl)
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  return data.secure_url
}

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

async function migrate() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  console.log('Fetching all checklists...')
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
      if (opSigs[day]?.data_url?.startsWith('data:image/')) {
        console.log(`  op | ${cl.id} | ${day}`)
        try {
          const url = await uploadBase64(opSigs[day].data_url, 'checklist-signatures', `${cl.id}_${day}_operator`)
          opSigs[day] = { ...opSigs[day], data_url: url }
          changed = true
          console.log(`  ok -> ${url.slice(0, 60)}...`)
        } catch (e) { console.error(`  FAIL operator ${cl.id} ${day}:`, e) }
      }
      if (supSigs[day]?.data_url?.startsWith('data:image/')) {
        console.log(`  sup | ${cl.id} | ${day}`)
        try {
          const url = await uploadBase64(supSigs[day].data_url, 'checklist-signatures', `${cl.id}_${day}_supervisor`)
          supSigs[day] = { ...supSigs[day], data_url: url }
          changed = true
          console.log(`  ok -> ${url.slice(0, 60)}...`)
        } catch (e) { console.error(`  FAIL supervisor ${cl.id} ${day}:`, e) }
      }
    }

    if (changed) {
      const { error: updateErr } = await supabase
        .from('checklists')
        .update({ operator_signatures: opSigs, supervisor_signatures: supSigs })
        .eq('id', cl.id)
      if (updateErr) console.error(`  DB update failed ${cl.id}:`, updateErr.message)
      else { updatedCount++; console.log(`  DB updated: ${cl.id}`) }
    }
  }
  console.log(`\nDone. ${updatedCount} checklists updated.`)
}

migrate().catch(err => { console.error('Migration failed:', err); process.exit(1) })
