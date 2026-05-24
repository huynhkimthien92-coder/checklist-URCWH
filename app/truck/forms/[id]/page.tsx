'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { SignaturePad } from '@/components/forms/SignaturePad'
import { QRScanner } from '@/components/forms/QRScanner'
import { Camera } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChecklistItem {
  id: string
  label_vi?: string
  label_en?: string
  status?: 'pass' | 'fail' | null
}

interface Order {
  invoice_no: string
  quantity: number | null
  dock_no: string
  checked_by: string
  created_by_id: string | null
}

interface Signature {
  signature_url: string | null
}

interface TruckForm {
  id: string
  form_no: string
  truck_no: string
  driver_name: string
  date: string
  customer_name: string
  description: string
  truck_size: string
  net_weight: number | null
  remarks: string
  start_loading_time: string | null
  end_loading_time: string | null
  status: 'draft' | 'submitted' | 'approved'
  items?: ChecklistItem[]
  orders?: Order[]
  signatures?: Record<string, Signature>
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REQUIRED_ROLES      = ['driver', 'warehouse', 'approver'] as const
const OPTIONAL_ROLES      = ['security'] as const
const ALL_SIGNATURE_ROLES = [...REQUIRED_ROLES, ...OPTIONAL_ROLES] as const
type SignatureRole = (typeof ALL_SIGNATURE_ROLES)[number]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    const pad = (n: number) => String(n).padStart(2, '0')
    return (
      d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      'T' + pad(d.getHours()) + ':' + pad(d.getMinutes())
    )
  } catch { return '' }
}

// ─── Design tokens ────────────────────────────────────────────────────────────
// Dark theme with high contrast — all text visible on dark backgrounds

const C = {
  // Backgrounds — layered from darkest to lightest
  bg0:      '#0d0f14',   // page background
  bg1:      '#131720',   // section card
  bg2:      '#1a2030',   // section header / table header
  bg3:      '#1f2840',   // input background
  bg3h:     '#253047',   // input hover

  // Borders
  border:   '#2a3550',
  borderHi: '#3d4f6e',

  // Text — high contrast hierarchy
  textPri:  '#f0f4ff',   // primary — headings, values
  textSec:  '#b8c5e0',   // secondary — labels, meta
  textTer:  '#6e84aa',   // tertiary — placeholders, hints
  textMut:  '#3d4f6e',   // muted — disabled text

  // Accent
  gold:     '#f5c842',
  goldDim:  '#7a6010',

  // Status
  green:    '#4ade80',
  greenBg:  '#0d2d1a',
  greenBdr: '#166534',

  red:      '#f87171',
  redBg:    '#2d0d0d',
  redBdr:   '#7f1d1d',

  blue:     '#60a5fa',
  blueBg:   '#0d1a2d',
  blueBdr:  '#1e3a5f',

  amber:    '#fbbf24',
  amberBg:  '#2d1a0d',
  amberBdr: '#78350f',
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  page: {
    padding: '24px 16px 48px',
    maxWidth: 980,
    margin: '0 auto',
    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
    backgroundColor: C.bg0,
    minHeight: '100vh',
    color: C.textPri,
    boxSizing: 'border-box' as const,
  } as React.CSSProperties,

  topBar: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottom: `1px solid ${C.border}`,
    paddingBottom: 16,
    marginBottom: 20,
    flexWrap: 'wrap' as const,
    gap: 10,
  } as React.CSSProperties,

  title: {
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: C.gold,
    marginBottom: 8,
  } as React.CSSProperties,

  metaRow: {
    display: 'flex',
    gap: '4px 20px',
    flexWrap: 'wrap' as const,
    fontSize: 11,
  } as React.CSSProperties,

  metaLabel: {
    color: C.textTer,
    marginRight: 4,
    letterSpacing: '0.06em',
  } as React.CSSProperties,

  metaVal: {
    color: C.textSec,
    fontWeight: 600,
  } as React.CSSProperties,

  topRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,

  statusBadge: (status: string) => ({
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    background:
      status === 'approved' ? C.greenBg :
      status === 'submitted' ? C.blueBg : C.amberBg,
    color:
      status === 'approved' ? C.green :
      status === 'submitted' ? C.blue : C.amber,
    border: `1px solid ${
      status === 'approved' ? C.greenBdr :
      status === 'submitted' ? C.blueBdr : C.amberBdr
    }`,
  }) as React.CSSProperties,

  saveBtn: (dirty: boolean, saving: boolean) => ({
    padding: '6px 14px',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    background: saving ? C.bg2 : dirty ? C.gold : C.bg2,
    color: saving ? C.textTer : dirty ? '#0d0f14' : C.textMut,
    border: `1px solid ${dirty && !saving ? C.goldDim : C.border}`,
    borderRadius: 4,
    cursor: dirty && !saving ? 'pointer' : 'default',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.15s',
  }) as React.CSSProperties,

  approveBtn: (disabled: boolean) => ({
    padding: '6px 14px',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    background: disabled ? C.bg2 : C.greenBg,
    color: disabled ? C.textMut : C.green,
    border: `1px solid ${disabled ? C.border : C.greenBdr}`,
    borderRadius: 4,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.15s',
  }) as React.CSSProperties,

  // ── Section card ──
  section: {
    marginBottom: 20,
    background: C.bg1,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    overflow: 'hidden' as const,
  } as React.CSSProperties,

  sectionHead: {
    padding: '9px 16px',
    background: C.bg2,
    borderBottom: `1px solid ${C.border}`,
    fontSize: 10,
    letterSpacing: '0.2em',
    textTransform: 'uppercase' as const,
    color: C.textSec,        // ✅ legible label color
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  } as React.CSSProperties,

  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: C.gold,
    flexShrink: 0,
  } as React.CSSProperties,

  sectionBody: {
    padding: '14px 16px',
  } as React.CSSProperties,

  // ── Field grid ──
  fieldGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))',
    gap: '14px 16px',
  } as React.CSSProperties,

  fieldGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 5,
    minWidth: 0,
  } as React.CSSProperties,

  // ✅ Labels — bright enough to read
  label: {
    fontSize: 9,
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    color: C.textSec,
    fontWeight: 700,
  } as React.CSSProperties,

  // ✅ Inputs — clearly visible text
  input: (disabled: boolean) => ({
    padding: '8px 10px',
    fontSize: 13,
    background: disabled ? 'transparent' : C.bg3,
    border: `1px solid ${disabled ? C.bg2 : C.border}`,
    borderRadius: 5,
    color: disabled ? C.textTer : C.textPri,
    fontFamily: 'inherit',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
    minWidth: 0,
    transition: 'border-color 0.15s',
  }) as React.CSSProperties,

  textarea: (disabled: boolean) => ({
    padding: '8px 10px',
    fontSize: 13,
    background: disabled ? 'transparent' : C.bg3,
    border: `1px solid ${disabled ? C.bg2 : C.border}`,
    borderRadius: 5,
    color: disabled ? C.textTer : C.textPri,
    fontFamily: 'inherit',
    outline: 'none',
    resize: 'vertical' as const,
    minHeight: 60,
    width: '100%',
    boxSizing: 'border-box' as const,
    lineHeight: 1.5,
  }) as React.CSSProperties,

  // ── Table ──
  tableWrapper: {
    overflowX: 'auto' as const,
    WebkitOverflowScrolling: 'touch' as const,
  } as React.CSSProperties,

  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    minWidth: 500,
  } as React.CSSProperties,

  // ✅ Table headers — clearly visible
  th: {
    padding: '9px 10px',
    fontSize: 9,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: C.textSec,
    background: C.bg2,
    borderBottom: `1px solid ${C.border}`,
    textAlign: 'left' as const,
    fontWeight: 700,
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,

  td: {
    padding: '5px 5px',
    borderBottom: `1px solid ${C.bg2}`,
    verticalAlign: 'middle' as const,
  } as React.CSSProperties,

  // ✅ Table inputs — clearly visible
  tableInput: (disabled: boolean) => ({
    padding: '6px 8px',
    fontSize: 12,
    background: disabled ? 'transparent' : C.bg3,
    border: `1px solid ${disabled ? 'transparent' : C.border}`,
    borderRadius: 4,
    color: disabled ? C.textSec : C.textPri,
    fontFamily: 'inherit',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
    minWidth: 0,
  }) as React.CSSProperties,

  invoiceCell: {
    display: 'flex',
    gap: 4,
    alignItems: 'center',
  } as React.CSSProperties,

  scanBtn: {
    flexShrink: 0,
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: C.bg3,
    border: `1px solid ${C.borderHi}`,
    borderRadius: 4,
    cursor: 'pointer',
    color: C.textSec,
    transition: 'all 0.15s',
  } as React.CSSProperties,

  delBtn: (canEdit: boolean) => ({
    padding: '5px 9px',
    fontSize: 10,
    fontWeight: 700,
    border: `1px solid ${canEdit ? C.redBdr : C.border}`,
    borderRadius: 4,
    cursor: canEdit ? 'pointer' : 'not-allowed',
    fontFamily: 'inherit',
    textTransform: 'uppercase' as const,
    background: 'transparent',
    color: canEdit ? C.red : C.textMut,
    whiteSpace: 'nowrap' as const,
    opacity: canEdit ? 1 : 0.5,
  }) as React.CSSProperties,

  addRowBtn: {
    marginTop: 10,
    padding: '7px 14px',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    background: 'transparent',
    border: `1px dashed ${C.borderHi}`,
    borderRadius: 5,
    color: C.textSec,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  } as React.CSSProperties,

  lockedTag: {
    fontSize: 9,
    color: C.textTer,
    letterSpacing: '0.06em',
    marginTop: 2,
  } as React.CSSProperties,

  // ✅ Checklist buttons — visible even inactive
  passBtn: (active: boolean, disabled: boolean) => ({
    width: 32,
    height: 32,
    borderRadius: 5,
    border: `1px solid ${active ? C.greenBdr : C.border}`,
    background: active ? C.greenBg : 'transparent',
    color: active ? C.green : C.textTer,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 14,
    fontWeight: 700,
    opacity: disabled && !active ? 0.4 : 1,
    transition: 'all 0.15s',
  }) as React.CSSProperties,

  failBtn: (active: boolean, disabled: boolean) => ({
    width: 32,
    height: 32,
    borderRadius: 5,
    border: `1px solid ${active ? C.redBdr : C.border}`,
    background: active ? C.redBg : 'transparent',
    color: active ? C.red : C.textTer,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 14,
    fontWeight: 700,
    opacity: disabled && !active ? 0.4 : 1,
    transition: 'all 0.15s',
  }) as React.CSSProperties,

  signaturesRow: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,

  signatureCard: (required: boolean) => ({
    flex: '1 1 160px',
    minWidth: 0,
    background: C.bg0,
    border: `1px solid ${required ? C.borderHi : C.border}`,
    borderRadius: 7,
    padding: 14,
    textAlign: 'center' as const,
  }) as React.CSSProperties,

  signatureRole: {
    fontSize: 10,
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    color: C.textSec,
    fontWeight: 700,
    marginBottom: 3,
  } as React.CSSProperties,

  requiredTag: {
    fontSize: 8,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: C.amber,
    marginBottom: 10,
  } as React.CSSProperties,

  optionalTag: {
    fontSize: 8,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: C.textMut,
    marginBottom: 10,
  } as React.CSSProperties,

  clearSigBtn: {
    marginTop: 8,
    padding: '4px 10px',
    fontSize: 10,
    fontWeight: 700,
    border: `1px solid ${C.redBdr}`,
    borderRadius: 4,
    color: C.red,
    background: 'transparent',
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '0.06em',
  } as React.CSSProperties,

  // ── Alert boxes ──
  errorBox: {
    padding: '10px 14px',
    background: C.redBg,
    border: `1px solid ${C.redBdr}`,
    borderRadius: 6,
    color: C.red,
    fontSize: 12,
    marginBottom: 14,
    letterSpacing: '0.02em',
  } as React.CSSProperties,

  successBox: {
    padding: '10px 14px',
    background: C.greenBg,
    border: `1px solid ${C.greenBdr}`,
    borderRadius: 6,
    color: C.green,
    fontSize: 12,
    marginBottom: 14,
    letterSpacing: '0.02em',
  } as React.CSSProperties,

  loadingState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontFamily: "'IBM Plex Mono', monospace",
    color: C.textTer,
    fontSize: 13,
    background: C.bg0,
    letterSpacing: '0.1em',
  } as React.CSSProperties,

  // checklist row item text
  checklistLabel: {
    paddingLeft: 14,
    fontSize: 12,
    color: C.textSec,
    lineHeight: 1.5,
  } as React.CSSProperties,

  // empty state
  emptyRow: {
    textAlign: 'center' as const,
    color: C.textMut,
    fontSize: 12,
    padding: '20px 0',
    letterSpacing: '0.04em',
  } as React.CSSProperties,
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TruckFormPage() {
  const params            = useParams()
  const id                = params?.id as string
  const { data: session } = useSession()
  const userRole          = (session?.user as any)?.role    as string | undefined
  const currentUserId     = (session?.user as any)?.id      as string | undefined
  const currentUserName   = session?.user?.name             ?? 'Unknown'

  const [form, setForm]               = useState<TruckForm | null>(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState('')
  const [saving, setSaving]           = useState(false)
  const [dirty, setDirty]             = useState(false)
  const [savingItems, setSavingItems] = useState<Set<string>>(new Set())
  const [scanningRow, setScanningRow] = useState<number | null>(null)
  const scannedRef                    = useRef(false)

  // ─── Load ─────────────────────────────────────────────────────────────────

  const loadForm = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res  = await fetch(`/api/truck/forms/${id}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed to load form')
      setForm(data.data)
      setDirty(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { if (id) loadForm() }, [id, loadForm])

  // ─── Field helpers ─────────────────────────────────────────────────────────

  const setField = <K extends keyof TruckForm>(key: K, value: TruckForm[K]) => {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev)
    setDirty(true)
  }

  // ─── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form || !dirty || saving) return
    setSaving(true); setError(''); setSuccess('')
    try {
      const res  = await fetch(`/api/truck/forms/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name:      form.customer_name,
          description:        form.description,
          truck_size:         form.truck_size,
          net_weight:         form.net_weight,
          remarks:            form.remarks,
          start_loading_time: form.start_loading_time,
          end_loading_time:   form.end_loading_time,
          invoice_nos:        form.orders?.map((o) => o.invoice_no)    ?? [],
          quantities:         form.orders?.map((o) => o.quantity)      ?? [],
          dock_nos:           form.orders?.map((o) => o.dock_no)       ?? [],
          checked_bys:        form.orders?.map((o) => o.checked_by)    ?? [],
          created_by_ids:     form.orders?.map((o) => o.created_by_id) ?? [],
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Save failed')
      setDirty(false)
      setSuccess('Saved successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ─── Orders CRUD ───────────────────────────────────────────────────────────

  const addOrder = () => {
    setForm((prev) => prev ? {
      ...prev,
      orders: [...(prev.orders ?? []), {
        invoice_no: '', quantity: null, dock_no: '',
        checked_by: currentUserName, created_by_id: currentUserId ?? null,
      }],
    } : prev)
    setDirty(true)
  }

  const updateOrder = (i: number, field: keyof Order, value: string | number | null) => {
    setForm((prev) => {
      if (!prev) return prev
      const orders = [...(prev.orders ?? [])]
      orders[i] = { ...orders[i], [field]: value }
      return { ...prev, orders }
    })
    setDirty(true)
  }

  const deleteOrder = (i: number) => {
    setForm((prev) => prev
      ? { ...prev, orders: prev.orders?.filter((_, idx) => idx !== i) ?? [] }
      : prev
    )
    setDirty(true)
  }

  const canEditOrder = (order: Order) =>
    !order.created_by_id || order.created_by_id === currentUserId

  // ─── QR Scan ───────────────────────────────────────────────────────────────

  const handleScan = (value: string) => {
    if (scannedRef.current || scanningRow === null) return
    scannedRef.current = true
    updateOrder(scanningRow, 'invoice_no', value.replace(/\s/g, '').toUpperCase())
    setScanningRow(null)
    setTimeout(() => { scannedRef.current = false }, 1000)
  }

  // ─── Checklist (optimistic) ────────────────────────────────────────────────

  const updateItem = async (itemId: string, status: 'pass' | 'fail') => {
    setError('')
    setForm((prev) => prev
      ? { ...prev, items: prev.items?.map((it) => it.id === itemId ? { ...it, status } : it) }
      : prev
    )
    setSavingItems((prev) => new Set(prev).add(itemId))
    try {
      const res  = await fetch('/api/truck/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ id: itemId, status }] }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed to update item')
    } catch (err: any) {
      setForm((prev) => prev
        ? { ...prev, items: prev.items?.map((it) => it.id === itemId ? { ...it, status: null } : it) }
        : prev
      )
      setError(err.message)
    } finally {
      setSavingItems((prev) => { const n = new Set(prev); n.delete(itemId); return n })
    }
  }

  // ─── Signature ─────────────────────────────────────────────────────────────

  const saveSignature = async (role: SignatureRole, url: string) => {
    setError('')
    try {
      const res  = await fetch('/api/truck/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_id: form?.id, role, user_name: currentUserName,
          signature_url: url, signed_by_role: role,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed to save signature')
      setForm((prev) => prev
        ? { ...prev, signatures: { ...prev.signatures, [role]: { signature_url: url } } }
        : prev
      )
    } catch (err: any) { setError(err.message) }
  }

  const clearSignature = async (role: SignatureRole) => {
    setError('')
    try {
      const res  = await fetch('/api/truck/sign', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form_id: form?.id, role }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed to clear')
      setForm((prev) => prev
        ? { ...prev, signatures: { ...prev.signatures, [role]: { signature_url: null } } }
        : prev
      )
    } catch (err: any) { setError(err.message) }
  }

  // ─── Approve ───────────────────────────────────────────────────────────────

  const approve = async () => {
    if (dirty) { setError('Please save changes before approving'); return }
    setError('')
    try {
      const res  = await fetch(`/api/truck/forms/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed to approve')
      loadForm()
    } catch (err: any) { setError(err.message) }
  }

  // ─── Guards ────────────────────────────────────────────────────────────────

  if (loading) return <div style={S.loadingState}>Loading…</div>
  if (!form)   return <div style={S.loadingState}>Form not found.</div>

  const isApproved   = form.status === 'approved'
  const canApprove   = userRole === 'supervisor' && !isApproved && !dirty

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={S.page}>

      {/* ── Top bar ── */}
      <div style={S.topBar}>
        <div>
          <div style={S.title}>🚚 Truck Exit Form</div>
          <div style={S.metaRow}>
            {[
              ['Form No', form.form_no],
              ['Truck',   form.truck_no],
              ['Driver',  form.driver_name],
              ['Date',    form.date],
            ].map(([label, val]) => (
              <span key={label}>
                <span style={S.metaLabel}>{label}</span>
                <span style={S.metaVal}>{val}</span>
              </span>
            ))}
          </div>
        </div>
        <div style={S.topRight}>
          <span style={S.statusBadge(form.status)}>{form.status}</span>
          {!isApproved && (
            <button
              onClick={handleSave}
              disabled={!dirty || saving}
              style={S.saveBtn(dirty, saving)}
            >
              {saving ? 'Saving…' : dirty ? '● Save' : 'Saved'}
            </button>
          )}
          <button
            onClick={approve}
            disabled={!canApprove}
            style={S.approveBtn(!canApprove)}
            title={
              isApproved         ? 'Already approved' :
              dirty              ? 'Save first' :
              userRole !== 'supervisor' ? 'Supervisor only' : ''
            }
          >
            {isApproved ? '✓ Approved' : 'Approve'}
          </button>
        </div>
      </div>

      {/* ── Alerts ── */}
      {error   && <div style={S.errorBox}>⚠ {error}</div>}
      {success && <div style={S.successBox}>✓ {success}</div>}

      {/* ── Form Details ── */}
      <div style={S.section}>
        <SectionHead label="Form Details" />
        <div style={S.sectionBody}>
          <div style={S.fieldGrid}>

            <Field label="Customer Name" disabled={isApproved}>
              <input style={S.input(isApproved)} disabled={isApproved}
                value={form.customer_name ?? ''}
                onChange={(e) => setField('customer_name', e.target.value)}
                placeholder="—" />
            </Field>

            <Field label="Truck Size" disabled={isApproved}>
              <input style={S.input(isApproved)} disabled={isApproved}
                value={form.truck_size ?? ''}
                onChange={(e) => setField('truck_size', e.target.value)}
                placeholder="—" />
            </Field>

            <Field label="Net Weight (kg)" disabled={isApproved}>
              <input style={S.input(isApproved)} disabled={isApproved}
                type="number"
                value={form.net_weight ?? ''}
                onChange={(e) => setField('net_weight', e.target.value ? Number(e.target.value) : null)}
                placeholder="—" />
            </Field>

            <Field label="Start Loading" disabled={isApproved}>
              <input style={S.input(isApproved)} disabled={isApproved}
                type="datetime-local"
                value={toDatetimeLocal(form.start_loading_time)}
                onChange={(e) => setField('start_loading_time', e.target.value || null)} />
            </Field>

            <Field label="End Loading" disabled={isApproved}>
              <input style={S.input(isApproved)} disabled={isApproved}
                type="datetime-local"
                value={toDatetimeLocal(form.end_loading_time)}
                onChange={(e) => setField('end_loading_time', e.target.value || null)} />
            </Field>

            <div style={{ ...S.fieldGroup, gridColumn: 'span 2' }}>
              <label style={S.label}>Description</label>
              <textarea style={S.textarea(isApproved)} disabled={isApproved}
                value={form.description ?? ''}
                onChange={(e) => setField('description', e.target.value)}
                placeholder="—" />
            </div>

            <div style={{ ...S.fieldGroup, gridColumn: 'span 2' }}>
              <label style={S.label}>Remarks</label>
              <textarea style={S.textarea(isApproved)} disabled={isApproved}
                value={form.remarks ?? ''}
                onChange={(e) => setField('remarks', e.target.value)}
                placeholder="—" />
            </div>

          </div>
        </div>
      </div>

      {/* ── Orders ── */}
      <div style={S.section}>
        <SectionHead label="Orders" />
        <div style={S.sectionBody}>
          <div style={S.tableWrapper}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={{ ...S.th, minWidth: 160 }}>Invoice No</th>
                  <th style={{ ...S.th, width: 80 }}>Qty</th>
                  <th style={{ ...S.th, minWidth: 80 }}>Dock</th>
                  <th style={{ ...S.th, minWidth: 110 }}>Checked By</th>
                  {!isApproved && <th style={{ ...S.th, width: 54 }} />}
                </tr>
              </thead>
              <tbody>
                {(form.orders ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={isApproved ? 4 : 5} style={S.emptyRow}>
                      No orders yet
                    </td>
                  </tr>
                ) : (form.orders ?? []).map((order, i) => {
                  const editable = !isApproved && canEditOrder(order)
                  return (
                    <tr key={i}>
                      <td style={S.td}>
                        <div style={S.invoiceCell}>
                          <input style={S.tableInput(!editable)} disabled={!editable}
                            value={order.invoice_no}
                            onChange={(e) => updateOrder(i, 'invoice_no', e.target.value.toUpperCase())}
                            placeholder="INV-001" />
                          {editable && (
                            <button style={S.scanBtn}
                              onClick={() => { scannedRef.current = false; setScanningRow(i) }}
                              title="Scan barcode">
                              <Camera size={13} />
                            </button>
                          )}
                        </div>
                        {order.created_by_id && !editable && (
                          <div style={S.lockedTag}>🔒 locked</div>
                        )}
                      </td>
                      <td style={S.td}>
                        <input style={S.tableInput(!editable)} disabled={!editable}
                          type="number"
                          value={order.quantity ?? ''}
                          onChange={(e) => updateOrder(i, 'quantity', e.target.value ? Number(e.target.value) : null)}
                          placeholder="0" />
                      </td>
                      <td style={S.td}>
                        <input style={S.tableInput(!editable)} disabled={!editable}
                          value={order.dock_no}
                          onChange={(e) => updateOrder(i, 'dock_no', e.target.value)}
                          placeholder="D-01" />
                      </td>
                      <td style={S.td}>
                        <input style={S.tableInput(true)} disabled
                          value={order.checked_by}
                          title="Auto-filled from your account" />
                      </td>
                      {!isApproved && (
                        <td style={S.td}>
                          <button style={S.delBtn(editable)} disabled={!editable}
                            onClick={() => editable && deleteOrder(i)}
                            title={editable ? 'Delete' : 'Only the creator can delete'}>
                            Del
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {!isApproved && (
            <button style={S.addRowBtn} onClick={addOrder}>+ Add Order</button>
          )}
        </div>
      </div>

      {/* ── Checklist ── */}
      <div style={S.section}>
        <SectionHead label="Checklist" />
        <div style={S.tableWrapper}>
          <table style={{ ...S.table, minWidth: 320 }}>
            <thead>
              <tr>
                <th style={{ ...S.th, paddingLeft: 14 }}>Item</th>
                <th style={{ ...S.th, width: 58, textAlign: 'center' as const }}>Pass</th>
                <th style={{ ...S.th, width: 58, textAlign: 'center' as const }}>Fail</th>
              </tr>
            </thead>
            <tbody>
              {form.items?.map((item) => {
                const isSaving   = savingItems.has(item.id)
                const isDisabled = isApproved || isSaving
                return (
                  <tr key={item.id}>
                    <td style={{ ...S.td, ...S.checklistLabel }}>
                      {item.label_vi || item.label_en}
                    </td>
                    <td style={{ ...S.td, textAlign: 'center' as const }}>
                      <button disabled={isDisabled}
                        onClick={() => updateItem(item.id, 'pass')}
                        style={S.passBtn(item.status === 'pass', isDisabled)}>
                        {isSaving && item.status === 'pass' ? '…' : '✓'}
                      </button>
                    </td>
                    <td style={{ ...S.td, textAlign: 'center' as const }}>
                      <button disabled={isDisabled}
                        onClick={() => updateItem(item.id, 'fail')}
                        style={S.failBtn(item.status === 'fail', isDisabled)}>
                        {isSaving && item.status === 'fail' ? '…' : '✕'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Signatures ── */}
      <div style={S.section}>
        <SectionHead label="Signatures" />
        <div style={S.sectionBody}>
          <div style={S.signaturesRow}>
            {ALL_SIGNATURE_ROLES.map((role) => {
              const isRequired = (REQUIRED_ROLES as readonly string[]).includes(role)
              const hasSig     = !!form.signatures?.[role]?.signature_url
              const canSign    = !isApproved && userRole === role
              return (
                <div key={role} style={S.signatureCard(isRequired)}>
                  <div style={S.signatureRole}>{role}</div>
                  <div style={isRequired ? S.requiredTag : S.optionalTag}>
                    {isRequired ? 'required' : 'optional'}
                  </div>
                  <SignaturePad
                    label={`Sign as ${role}`}
                    disabled={!canSign}
                    existingSignature={form.signatures?.[role]?.signature_url ?? null}
                    onSave={(url) => saveSignature(role, url)}
                  />
                  {canSign && hasSig && (
                    <button style={S.clearSigBtn} onClick={() => clearSignature(role)}>
                      Clear
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── QR Scanner modal ── */}
      {scanningRow !== null && (
        <QRScanner
          onScan={handleScan}
          onClose={() => setScanningRow(null)}
        />
      )}

    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHead({ label }: { label: string }) {
  return (
    <div style={{
      padding: '9px 16px',
      background: C.bg2,
      borderBottom: `1px solid ${C.border}`,
      fontSize: 10,
      letterSpacing: '0.2em',
      textTransform: 'uppercase' as const,
      color: C.textSec,
      fontWeight: 700,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.gold, flexShrink: 0, display: 'inline-block' }} />
      {label}
    </div>
  )
}

function Field({ label, disabled, children }: {
  label: string
  disabled: boolean
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
      <label style={{
        fontSize: 9, letterSpacing: '0.14em',
        textTransform: 'uppercase' as const,
        color: disabled ? C.textTer : C.textSec,
        fontWeight: 700,
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}
