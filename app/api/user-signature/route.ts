/**
 * app/api/user-signature/route.ts
 *
 * GET    → trả về chữ ký cá nhân đã khai báo của user đang đăng nhập.
 * DELETE → xoá chữ ký đã khai báo (để khai báo lại từ đầu).
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { deleteFromCloudinary } from '@/lib/cloudinary'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any)?.id

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('users')
    .select('signature_url, signature_updated_at')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('[user-signature][GET]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    url: data?.signature_url || null,
    updated_at: data?.signature_updated_at || null,
  })
}

export async function DELETE() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any)?.id

  const supabase = createServiceClient()

  const { data: current } = await supabase
    .from('users')
    .select('signature_public_id')
    .eq('id', userId)
    .single()

  if (current?.signature_public_id) {
    try {
      await deleteFromCloudinary(current.signature_public_id)
    } catch (err) {
      console.error('[user-signature][DELETE] cloudinary cleanup failed:', err)
      // vẫn tiếp tục xoá reference trong DB dù cleanup ảnh thất bại
    }
  }

  const { error } = await supabase
    .from('users')
    .update({
      signature_url: null,
      signature_public_id: null,
      signature_updated_at: null,
    })
    .eq('id', userId)

  if (error) {
    console.error('[user-signature][DELETE]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
