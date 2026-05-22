import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ===== GET COUNT =====
export async function GET() {
  try {

    // ✅ lấy session
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const now = new Date()

    // ✅ query nhẹ (chỉ lấy field cần)
    const issues = await prisma.issue.findMany({
      where: {
        assigned_to: userId,
        status: {
          not: 'done'
        }
      },
      select: {
        status: true,
        priority: true,
        due_date: true
      }
    })

    // ===== COUNT =====
    let open = 0
    let overdue = 0
    let high = 0

    for (const issue of issues) {

      // ✅ open
      if (issue.status === 'open') {
        open++
      }

      // ✅ high priority
      if (issue.priority === 'high') {
        high++
      }

      // ✅ overdue
      if (issue.due_date) {
        const due = new Date(issue.due_date + 'T23:59:59')

        if (now > due) {
          overdue++
        }
      }
    }

    return NextResponse.json({
      open,
      overdue,
      high,
      total: issues.length
    })

  } catch (error) {
    console.error('COUNT ISSUE ERROR:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
