import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { oldPassword, newPassword } = await req.json()

  const userId = (session.user as any).id

  const supabase = createServiceClient()

  // lấy user
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // check password cũ
  const isMatch = await bcrypt.compare(oldPassword, user.password_hash)

  if (!isMatch) {
    return NextResponse.json({ error: 'Sai mật khẩu cũ' }, { status: 400 })
  }

  // hash password mới
  const hashed = await bcrypt.hash(newPassword, 10)

  await supabase
    .from('users')
    .update({ password_hash: hashed })
    .eq('id', userId)

  return NextResponse.json({ success: true })
}
