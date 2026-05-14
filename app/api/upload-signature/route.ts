/**
 * app/api/upload-signature/route.ts
 * Nhận base64 dataURL chữ ký từ client → upload lên Cloudinary → trả về URL.
 *
 * POST body (JSON):
 *   { dataUrl: string, checklistId: string, day: string, role: 'operator' | 'supervisor' }
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadToCloudinary } from '@/lib/cloudinary'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { dataUrl, checklistId, day, role } = await req.json()

  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return NextResponse.json({ error: 'Invalid dataUrl' }, { status: 400 })
  }
  if (!checklistId || !day || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    // public_id cố định → tự động overwrite khi ký lại cùng ngày
    const publicId = `${checklistId}_${day}_${role}`

    const result = await uploadToCloudinary(
      dataUrl,
      'checklist-signatures',
      publicId,
    )

    return NextResponse.json({ url: result.secure_url, public_id: result.public_id })
  } catch (err: any) {
    console.error('[upload-signature]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
