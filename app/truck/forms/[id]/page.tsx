'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { SignaturePad } from '@/components/forms/SignaturePad'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChecklistItem {
  id: string
  label_vi?: string
  label_en?: string
  status?: 'pass' | 'fail' | null
}

interface Order {
  invoice_no: string
  quantity: number
  dock_no: string
  checked_by: string
}

interface Signature {
  signature_url: string | null
}

interface TruckForm {
  id: string
  form_no: string
  truck_no: string
  driver_name: string
  status: 'draft' | 'submitted' | 'approved'
  items?: ChecklistItem[]
  orders?: Order[]
  signatures?: Record<string, Signature>
}

// ─── Constants ────────────────────────────────────────────────────────────────

// ✅ FIX: phải khớp với requiredRoles trong status/route.ts
// API yêu cầu: ['driver', 'warehouse', 'approver']
// 'security' là optional — không bắt buộc để approve
const REQUIRED_ROLES    = ['driver', 'warehouse', 'approver'] as const
const OPTIONAL_ROLES    = ['security'] as const
const ALL_SIGNATURE_ROLES = [...REQUIRED_ROLES, ...OPTIONAL_ROLES] as const
type SignatureRole = (typeof ALL_SIGNATURE_ROLES)[number]

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  page: {
    padding: '32px 24px',
    maxWidth: 960,
    margin: '0 auto',
    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
    backgroundColor: '#0f1117',
    minHeight: '100vh',
    color: '#e2e8f0',
  } as React.CSSProperties,

  header: {
    borderBottom: '2px solid #2d3748',
    paddingBottom: 20,
    marginBottom: 32,
  } as React.CSSProperties,

  title: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: '#f7c948',
    marginBottom: 16,
  } as React.CSSProperties,

  metaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '10px 24px',
  } as React.CSSProperties,

  metaItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
  } as React.CSSProperties,

  metaLabel: {
    fontSize: 10,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: '#718096',
  } as React.CSSProperties,

  metaValue: {
    fontSize: 14,
    fontWeight: 600,
    color: '#e2e8f0',
  } as React.CSSProperties,

  statusBadge: (status: string) => ({
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    background: status === 'approved' ? '#1a3a2a' : '#2a2010',
    color: status === 'approved' ? '#48bb78' : '#f7c948',
    border: `1px solid ${status === 'approved' ? '#276749' : '#b7791f'}`,
  }) as React.CSSProperties,

  section: {
    marginBottom: 36,
  } as React.CSSProperties,

  sectionTitle: {
    fontSize: 11,
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    color: '#718096',
    marginBottom: 12,
    paddingBottom: 6,
    borderBottom: '1px solid #2d3748',
  } as React.CSSProperties,

  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  } as React.CSSProperties,

  th: {
    padding: '10px 14px',
    fontSize: 10,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: '#718096',
    background: '#171923',
    borderBottom: '1px solid #2d3748',
    textAlign: 'left' as const,
  } as React.CSSProperties,

  td: {
    padding: '10px 14px',
    fontSize: 13,
    borderBottom: '1px solid #1a202c',
    color: '#cbd5e0',
  } as React.CSSProperties,

  tdCenter: {
    padding: '10px 14px',
    fontSize: 13,
    borderBottom: '1px solid #1a202c',
    color: '#cbd5e0',
    textAlign: 'center' as const,
  } as React.CSSProperties,

  passBtn: (active: boolean, disabled: boolean) => ({
    width: 32,
    height: 32,
    borderRadius: 4,
    border: `1px solid ${active ? '#276749' : '#2d3748'}`,
    background: active ? '#1a3a2a' : 'transparent',
    color: active ? '#48bb78' : '#4a5568',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 14,
    fontWeight: 700,
    transition: 'all 0.15s ease',
    opacity: disabled ? 0.5 : 1,
  }) as React.CSSProperties,

  failBtn: (active: boolean, disabled: boolean) => ({
    width: 32,
    height: 32,
    borderRadius: 4,
    border: `1px solid ${active ? '#742a2a' : '#2d3748'}`,
    background: active ? '#3b1515' : 'transparent',
    color: active ? '#fc8181' : '#4a5568',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 14,
    fontWeight: 700,
    transition: 'all 0.15s ease',
    opacity: disabled ? 0.5 : 1,
  }) as React.CSSProperties,

  signaturesRow: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,

  signatureCard: (required: boolean) => ({
    flex: '1 1 200px',
    background: '#171923',
    border: `1px solid ${required ? '#2d3748' : '#1a202c'}`,
    borderRadius: 8,
    padding: 16,
    textAlign: 'center' as const,
  }) as React.CSSProperties,

  signatureRoleLabel: {
    fontSize: 10,
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    color: '#718096',
    marginBottom: 4,
    fontWeight: 600,
  } as React.CSSProperties,

  requiredBadge: {
    fontSize: 9,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: '#f7c948',
    marginBottom: 10,
  } as React.CSSProperties,

  optionalBadge: {
    fontSize: 9,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: '#4a5568',
    marginBottom: 10,
  } as React.CSSProperties,

  errorBox: {
    padding: '12px 16px',
    background: '#3b1515',
    border: '1px solid #742a2a',
    borderRadius: 6,
    color: '#fc8181',
    fontSize: 13,
    marginBottom: 16,
  } as React.CSSProperties,

  approveBtn: (disabled: boolean) => ({
    padding: '12px 32px',
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    background: disabled ? '#2d3748' : '#f7c948',
    color: disabled ? '#4a5568' : '#0f1117',
    border: 'none',
    borderRadius: 6,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
  }) as React.CSSProperties,

  loadingState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontFamily: "'IBM Plex Mono', monospace",
    color: '#718096',
    fontSize: 14,
    letterSpacing: '0.1em',
    background: '#0f1117',
  } as React.CSSProperties,
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TruckFormPage() {
  const params = useParams()
  const id = params?.id as string

  const [form, setForm]       = useState<TruckForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')   // ✅ inline error thay vì alert()

  // ─── Load form ─────────────────────────────────────────────────────────────

  const loadForm = async () => {
    setLoading(true)
    setError('')
    try {
      const res  = await fetch(`/api/truck/forms/${id}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed to load form')
      setForm(data.data)
    } catch (err: any) {
      setError(err.message || 'Failed to load form')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadForm()
  }, [id])

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const updateItem = async (itemId: string, status: 'pass' | 'fail') => {
    setError('')
    try {
      const res  = await fetch('/api/truck/items', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ items: [{ id: itemId, status }] }),
      })
      const data = await res.json()
      // ✅ FIX: check lỗi thay vì im lặng
      if (!data.success) throw new Error(data.error || 'Failed to update item')
      loadForm()
    } catch (err: any) {
      setError(err.message || 'Failed to update checklist item')
    }
  }

  const saveSignature = async (role: SignatureRole, url: string) => {
    setError('')
    try {
      const res  = await fetch('/api/truck/sign', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          form_id:        form?.id,
          role,
          user_name:      'Demo User',
          signature_url:  url,
          signed_by_role: role,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed to save signature')
      loadForm()
    } catch (err: any) {
      setError(err.message || 'Failed to save signature')
    }
  }

  const approve = async () => {
    setError('')
    try {
      const res  = await fetch(`/api/truck/forms/${id}/status`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: 'approved' }),
      })
      const data = await res.json()
      // ✅ FIX: inline error thay vì alert()
      if (!data.success) throw new Error(data.error || 'Failed to approve')
      loadForm()
    } catch (err: any) {
      setError(err.message || 'Approve failed')
    }
  }

  // ─── Loading / empty states ─────────────────────────────────────────────────

  if (loading) return <div style={styles.loadingState}>Loading…</div>
  if (!form)   return <div style={styles.loadingState}>Form not found.</div>

  const isApproved = form.status === 'approved'

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.title}>🚚 Truck Exit Form</div>
        <div style={styles.metaGrid}>
          <MetaItem label="Form No"  value={form.form_no} />
          <MetaItem label="Truck No" value={form.truck_no} />
          <MetaItem label="Driver"   value={form.driver_name} />
          <MetaItem
            label="Status"
            value={<span style={styles.statusBadge(form.status)}>{form.status}</span>}
          />
        </div>
      </div>

      {/* Inline error */}
      {error && <div style={styles.errorBox}>⚠ {error}</div>}

      {/* Orders */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Orders</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Invoice</th>
              <th style={styles.th}>Qty</th>
              <th style={styles.th}>Dock</th>
              <th style={styles.th}>Checked By</th>
            </tr>
          </thead>
          <tbody>
            {/* ✅ dùng invoice_no làm key thay vì index */}
            {form.orders?.map((o) => (
              <tr key={o.invoice_no}>
                <td style={styles.td}>{o.invoice_no}</td>
                <td style={styles.td}>{o.quantity}</td>
                <td style={styles.td}>{o.dock_no}</td>
                <td style={styles.td}>{o.checked_by}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Checklist */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Checklist</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Item</th>
              <th style={{ ...styles.th, textAlign: 'center', width: 80 }}>Pass</th>
              <th style={{ ...styles.th, textAlign: 'center', width: 80 }}>Fail</th>
            </tr>
          </thead>
          <tbody>
            {form.items?.map((item) => (
              <tr key={item.id}>
                <td style={styles.td}>{item.label_vi || item.label_en}</td>
                <td style={styles.tdCenter}>
                  <button
                    disabled={isApproved}
                    onClick={() => updateItem(item.id, 'pass')}
                    style={styles.passBtn(item.status === 'pass', isApproved)}
                    title="Pass"
                  >
                    ✓
                  </button>
                </td>
                <td style={styles.tdCenter}>
                  <button
                    disabled={isApproved}
                    onClick={() => updateItem(item.id, 'fail')}
                    style={styles.failBtn(item.status === 'fail', isApproved)}
                    title="Fail"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Signatures */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Signatures</div>
        <div style={styles.signaturesRow}>
          {/* ✅ FIX: render đủ 4 roles, khớp với API */}
          {ALL_SIGNATURE_ROLES.map((role) => {
            const isRequired = (REQUIRED_ROLES as readonly string[]).includes(role)
            return (
              <div key={role} style={styles.signatureCard(isRequired)}>
                <div style={styles.signatureRoleLabel}>{role}</div>
                <div style={isRequired ? styles.requiredBadge : styles.optionalBadge}>
                  {isRequired ? 'Required' : 'Optional'}
                </div>
                <SignaturePad
                  label={`Sign as ${role}`}
                  existingSignature={form.signatures?.[role]?.signature_url ?? null}
                  disabled={isApproved}
                  onSave={(url) => saveSignature(role, url)}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Approve */}
      <div>
        <button
          disabled={isApproved}
          onClick={approve}
          style={styles.approveBtn(isApproved)}
        >
          {isApproved ? '✓ Approved' : 'Approve Form'}
        </button>
      </div>

    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetaItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={styles.metaItem}>
      <span style={styles.metaLabel}>{label}</span>
      <span style={styles.metaValue}>{value}</span>
    </div>
  )
}
