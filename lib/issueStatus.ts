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
  if (issue.status === 'done') return 'completed'
  if (isOverdue(issue)) return 'overdue'
  if (isLate(issue)) return 'late'
  if (issue.status === 'in_progress') return 'in_progress'
  return 'open'
}

// ===== STYLE OBJECT (✅ QUAN TRỌNG) =====
export const getIssueStyle = (issue: Issue) => {
  const level = getIssueLevel(issue)

  switch (level) {
    case 'completed':
      return {
        bg: 'bg-green-500',
        text: 'text-green-600',
        icon: '✅',
        label: 'Completed'
      }

    case 'overdue':
      return {
        bg: 'bg-red-600 animate-pulse',
        text: 'text-red-600',
        icon: '⚠️',
        label: 'Overdue'
      }

    case 'late':
      return {
        bg: 'bg-orange-400',
        text: 'text-orange-500',
        icon: '🟠',
        label: 'Late'
      }

    case 'in_progress':
      return {
        bg: 'bg-yellow-400',
        text: 'text-yellow-500',
        icon: '🟡',
        label: 'In Progress'
      }

    default:
      return {
        bg: 'bg-red-500',
        text: 'text-red-500',
        icon: '🔴',
        label: 'Open'
      }
  }
}
