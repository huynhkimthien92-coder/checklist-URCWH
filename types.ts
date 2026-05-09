export type UserRole = 'admin' | 'operator' | 'supervisor'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  created_at: string
  active: boolean
}

export type CheckStatus = 'pass' | 'fail' | ''

export interface DayEntry {
  status: CheckStatus
  detail: string
  image_url?: string
}

export interface CheckItem {
  id: string
  category: 'observation' | 'operation'
  label_vi: string
  label_en: string
  sub_label?: string
  days: Record<string, DayEntry> // key: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
}

export interface Signature {
  data_url: string
  signed_at: string
  user_id: string
  user_name: string
}

export interface Checklist {
  id: string
  week_number: number
  year: number
  forklift_model: string
  forklift_serial: string
  forklift_number: string
  shift: string
  items: CheckItem[]
  operator_signatures: Record<string, Signature | null>  // key: day
  supervisor_signatures: Record<string, Signature | null> // key: day
  notes: string
  status: 'draft' | 'submitted' | 'reviewed' | 'approved'
  created_by: string
  created_at: string
  updated_at: string
  operator?: User
}
