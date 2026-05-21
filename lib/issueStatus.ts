import { Issue } from '@/types/issue'

// ===== DEADLINE =====
export const isOverdue = (issue: Issue) => {
  if (!issue.due_date || issue.status === 'done') return false

  const now = new Date()
  const due = new Date(issue.due_date + 'T23:59:59')

  const diff =
    (now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)

  return diff >= 7
}

export const isLate = (issue: Issue) => {
  if (!issue.due_date || issue.status === 'done') return false

  const now = new Date()
  const due = new Date(issue.due_date + 'T23:59:59')

  return now > due
}

// ===== LEVEL =====
export const getIssueLevel = (issue: Issue) => {

  if (issue.status === 'done') return 'completed'   // ✅ đổi tên

  if (isOverdue(issue)) return 'overdue'
  if (isLate(issue)) return 'late'

  if (issue.status === 'in_progress') return 'in_progress'

  return 'open'
}

// ===== COLOR =====
export const getIssueColor = (issue: Issue) => {
  switch (getIssueLevel(issue)) {
    case 'completed':
      return 'bg-green-500 text-green-600'

    case 'overdue':
      return 'bg-red-600 text-red-600'

    case 'late':
      return 'bg-orange-400 text-orange-500'

    case 'in_progress':
      return 'bg-yellow-400 text-yellow-500'

    default:
      return 'bg-red-500 text-red-500'
  }
}

// ===== ICON =====
export const getIssueIcon = (issue: Issue) => {
  switch (getIssueLevel(issue)) {
    case 'completed':
      return '✅'   // ✅ đổi từ 🟢 → dễ hiểu hơn

    case 'overdue':
      return '⚠️'

    case 'late':
      return '🟠'

    case 'in_progress':
      return '🟡'

    default:
      return '🔴'
  }
}

// ===== LABEL (bonus) =====
export const getIssueLabel = (issue: Issue) => {
  switch (getIssueLevel(issue)) {
    case 'completed':
      return 'Completed'

    case 'overdue':
      return 'Overdue'

    case 'late':
      return 'Late'

    case 'in_progress':
      return 'In Progress'

    default:
      return 'Open'
  }
}
