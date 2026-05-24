'use client'

import { useEffect, useState, useCallback } from 'react'
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
  quantity: number | null
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

const EMPTY_ORDER: Order = { invoice_no: '', quantity: null, dock_no: '', checked_by: '' }

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  page: {
    padding: '32px 24px',
    maxWidth: 980,
    margin: '0 auto',
    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
    backgroundColor: '#0a0c10',
    minHeight: '100vh',
    color: '#e2e8f0',
  } as React.CSSProperties,

  topBar: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottom: '1px solid #1e2533',
    paddingBottom: 20,
    marginBottom: 28,
    flexWrap: 'wrap' as const,
    gap: 12,
  } as React.CSSProperties,

  title: {
    fontSize: 17,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: '#f7c948',
    marginBottom: 6,
  } as React.CSSProperties,

  metaRow: {
    display: 'flex',
    gap: '4px 20px',
    flexWrap: 'wrap' as const,
    fontSize: 11,
    color: '#4a5568',
  } as React.CSSProperties,

  metaVal: { color: '#718096' } as React.CSSProperties,

  topRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
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
      status === 'approved' ? '#1a3a2a' :
      status === 'submitted' ? '#1a2a3a' : '#1e1a10',
    color:
      status === 'approved' ? '#48bb78' :
      status === 'submitted' ? '#63b3ed' : '#f7c948',
    border: `1px solid ${
      status === 'approved' ? '#276749' :
      status === 'submitted' ? '#2b6cb0' : '#b7791f'
    }`,
  }) as React.CSSProperties,

  saveBtn: (dirty: boolean, saving: boolean) => ({
    padding: '7px 16px',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    background: saving ? '#12161f' : dirty ? '#f7c948' : '#12161f',
    color: saving ? '#4a5568' : dirty ? '#0a0c10' : '#2d3748',
    border: `1px solid ${dirty && !saving ? '#b7791f' : '#1e2533'}`,
    borderRadius: 4,
    cursor: dirty && !saving ? 'pointer' : 'default',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  }) as React.CSSProperties,

  approveBtn: (disabled: boolean) => ({
    padding: '7px 16px',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    background: disabled ? '#12161f' : '#1a3a2a',
    color: disabled ? '#2d3748' : '#48bb78',
    border: `1px solid ${disabled ? '#1e2533' : '#276749'}`,
    borderRadius: 4,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  }) as React.CSSProperties,

  section: {
    marginBottom: 24,
    background: '#0e1117',
    border: '1px solid #1e2533',
    borderRadius: 7,
    overflow: 'hidden' as const,
  } as React.CSSProperties,

  sectionHead: {
    padding: '9px 16px',
    background: '#0a0c10',
    borderBottom: '1px solid #1e2533',
    fontSize: 9,
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    color: '#2d3748',
    fontWeight: 700,
  } as React.CSSProperties,

  sectionBody: { padding: 16 } as React.CSSProperties,

  fieldGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '14px 20px',
  } as React.CSSProperties,

  fieldGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  } as React.CSSProperties,

  label: {
    fontSize: 9,
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    color: '#4a5568',
    fontWeight: 700,
  } as React.CSSProperties,

  input: (disabled: boolean) => ({
    padding: '7px 10px',
    fontSize: 13,
    background: disabled ? 'transparent' : '#12161f',
    border: `1px solid ${disabled ? '#1a1e28' : '#2d3748'}`,
    borderRadius: 4,
    color: disabled ? '#4a5568' : '#e2e8f0',
    fontFamily: 'inherit',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  }) as React.CSSProperties,

  textarea: (disabled: boolean) => ({
    padding: '7px 10px',
    fontSize: 13,
    background: disabled ? 'transparent' : '#12161f',
    border: `1px solid ${disabled ? '#1a1e28' : '#2d3748'}`,
    borderRadius: 4,
    color: disabled ? '#4a5568' : '#e2e8f0',
    fontFamily: 'inherit',
    outline: 'none',
    resize: 'vertical' as const,
    minHeight: 60,
    width: '100%',
    boxSizing: 'border-box' as const,
  }) as React.CSSProperties,

  table: { width: '100%', borderCollapse: 'collapse' as const } as React.CSSProperties,

  th: {
    padding: '8px 10px',
    fontSize: 9,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: '#2d3748',
    background: '#0a0c10',
    borderBottom: '1px solid #1e2533',
    textAlign: 'left' as const,
    fontWeight: 700,
  } as React.CSSProperties,

  td: {
    padding: '5px 6px',
    borderBottom: '1px solid #0e1117',
    verticalAlign: 'middle' as const,
  } as React.CSSProperties,

  tableInput: (disabled: boolean) => ({
    padding: '5px 8px',
    fontSize: 12,
    background: disabled ? 'transparent' : '#12161f',
    border: `1px solid ${disabled ? 'transparent' : '#1e2533'}`,
    borderRadius: 3,
    color: disabled ? '#4a5568' : '#e2e8f0',
    fontFamily: 'inherit',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  }) as React.CSSProperties,

  delBtn: {
    padding: '4px 10px',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.06em',
    border: '1px solid #742a2a',
    borderRadius: 3,
    cursor: 'pointer',
    fontFamily: 'inherit',
    textTransform: 'uppercase' as const,
    background: 'transparent',
    color: '#fc8181',
  } as React.CSSProperties,

  addRowBtn: {
    marginTop: 10,
    padding: '6px 14px',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    background: 'transparent',
    border: '1px dashed #1e2533',
    borderRadius: 4,
    color: '#2d3748',
    cursor: 'pointer',
    fontFamily: 'inherit',
  } as React.CSSProperties,

  passBtn: (active: boolean, disabled: boolean) => ({
    width: 30,
    height: 30,
    borderRadius: 4,
    border: `1px solid ${active ? '#276749' : '#1e2533'}`,
    background: active ? '#1a3a2a' : 'transparent',
    color: active ? '#48bb78' : '#2d3748',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 13,
    fontWeight: 700,
    opacity: disabled ? 0.5 : 1,
  }) as React.CSSProperties,

  failBtn: (active: boolean, disabled: boolean) => ({
    width: 30,
    height: 30,
    borderRadius: 4,
    border: `1px solid ${active ? '#742a2a' : '#1e2533'}`,
    background: active ? '#3b1515' : 'transparent',
    color: active ? '#fc8181' : '#2d3748',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 13,
    fontWeight: 700,
    opacity: disabled ? 0.5 : 1,
  }) as React.CSSProperties,

  signaturesRow: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,

  signatureCard: (required: boolean) => ({
    flex: '1 1 180px',
    background: '#0a0c10',
    border: `1px solid ${required ? '#1e2533' : '#12161f'}`,
    borderRadius: 6,
    padding: 14,
    textAlign: 'center' as const,
  }) as React.CSSProperties,

  signatureRole: {
    fontSize: 9,
    letterSpacing: '0.16em',
    textTransform: 'uppercase' as const,
    color: '#4a5568',
    fontWeight: 700,
    marginBottom: 2,
  } as React.CSSProperties,

  requiredTag: {
    fontSize: 8,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: '#b7791f',
    marginBottom: 8,
  } as React.CSSProperties,

  optionalTag: {
    fontSize: 8,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: '#1e2533',
    marginBottom: 8,
  } as React.CSSProperties,

  errorBox: {
    padding: '10px 14px',
    background: '#180a0a',
    border: '1px solid #742a2a',
    borderRadius: 5,
    color: '#fc8181',
    fontSize: 12,
    marginBottom: 16,
  } as React.CSSProperties,

  successBox: {
    padding: '10px 14px',
    background: '#0a1810',
    border: '1px solid #276749',
    borderRadius: 5,
    color: '#48bb78',
    fontSize: 12,
    marginBottom: 16,
  } as React.CSSProperties,

  loadingState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontFamily: "'IBM Plex Mono', monospace",
    color: '#2d3748',
    fontSize: 13,
    background: '#0a0c10',
    letterSpacing: '0.1em',
  } as React.CSSProperties,
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TruckFormPage() {
  const params = useParams()
  const id = params?.id as string

  const [form, setForm]                   = useState<TruckForm | null>(null)
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState('')
  const [success, setSuccess]             = useState('')
  const [saving, setSaving]               = useState(false)
  const [dirty, setDirty]                 = useState(false)
  const [savingItems, setSavingItems]     = useState<Set<string>>(new Set())

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

  useEffect(() => {
    if (id) loadForm()
  }, [id, loadForm])

  // ─── Field helper ─────────────────────────────────────────────────────────

  const setField = <K extends keyof TruckForm>(key: K, value: TruckForm[K]) => {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev)
    setDirty(true)
  }

  // ─── Save header + orders ─────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form || !dirty || saving) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res  = await fetch(`/api/truck/forms/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          customer_name:      form.customer_name,
          description:        form.description,
          truck_size:         form.truck_size,
          net_weight:         form.net_weight,
          remarks:            form.remarks,
          start_loading_time: form.start_loading_time,
          end_loading_time:   form.end_loading_time,
          invoice_nos:        form.orders?.map((o) => o.invoice_no)  ?? [],
          quantities:         form.orders?.map((o) => o.quantity)    ?? [],
          dock_nos:           form.orders?.map((o) => o.dock_no)     ?? [],
          checked_bys:        form.orders?.map((o) => o.checked_by)  ?? [],
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Save failed')
      setDirty(false)
      setSuccess('Saved')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ─── Orders CRUD ──────────────────────────────────────────────────────────

  const addOrder = () => {
    setForm((prev) =>
      prev ? { ...prev, orders: [...(prev.orders ?? []), { ...EMPTY_ORDER }] } : prev
    )
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
    setForm((prev) => {
      if (!prev) return prev
      return { ...prev, orders: prev.orders?.filter((_, idx) => idx !== i) ?? [] }
    })
    setDirty(true)
  }

  // ─── Checklist (optimistic) ───────────────────────────────────────────────

  const updateItem = async (itemId: string, status: 'pass' | 'fail') => {
    setError('')
    setForm((prev) =>
      prev
        ? { ...prev, items: prev.items?.map((it) => it.id === itemId ? { ...it, status } : it) }
        : prev
    )
    setSavingItems((prev) => new Set(prev).add(itemId))
    try {
      const res  = await fetch('/api/truck/items', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ items: [{ id: itemId, status }] }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed to update item')
    } catch (err: any) {
      setForm((prev) =>
        prev
          ? { ...prev, items: prev.items?.map((it) => it.id === itemId ? { ...it, status: null } : it) }
          : prev
      )
      setError(err.message)
    } finally {
      setSavingItems((prev) => { const n = new Set(prev); n.delete(itemId); return n })
    }
  }

  // ─── Signature ────────────────────────────────────────────────────────────

  const saveSignature = async (role: SignatureRole, url: string) => {
    setError('')
    try {
      const res  = await fetch('/api/truck/sign', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          form_id: form?.id, role,
          user_name: 'Demo User',
          signature_url: url, signed_by_role: role,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed to save signature')
      setForm((prev) =>
        prev
          ? { ...prev, signatures: { ...prev.signatures, [role]: { signature_url: url } } }
          : prev
      )
    } catch (err: any) {
      setError(err.message)
    }
  }

  // ─── Approve ──────────────────────────────────────────────────────────────

  const approve = async () => {
    if (dirty) { setError('Please save changes before approving'); return }
    setError('')
    try {
      const res  = await fetch(`/api/truck/forms/${id}/status`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: 'approved' }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed to approve')
      loadForm()
    } catch (err: any) {
      setError(err.message)
    }
  }

  // ─── Guards ───────────────────────────────────────────────────────────────

  if (loading) return <div style={S.loadingState}>Loading…</div>
  if (!form)   return <div style={S.loadingState}>Form not found.</div>

  const isApproved = form.status === 'approved'

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={S.page}>

      {/* Top bar */}
      <div style={S.topBar}>
        <div>
          <div style={S.title}>🚚 Truck Exit Form</div>
          <div style={S.metaRow}>
            <span>Form <span style={S.metaVal}>{form.form_no}</span></span>
            <span>Truck <span style={S.metaVal}>{form.truck_no}</span></span>
            <span>Driver <span style={S.metaVal}>{form.driver_name}</span></span>
            <span>Date <span style={S.metaVal}>{form.date}</span></span>
          </div>
        </div>
        <div style={S.topRight}>
          <span style={S.statusBadge(form.status)}>{form.status}</span>
          {!isApproved && (
            <button onClick={handleSave} disabled={!dirty || saving} style={S.saveBtn(dirty, saving)}>
              {saving ? 'Saving…' : dirty ? '● Save' : 'Saved'}
            </button>
          )}
          <button
            onClick={approve}
            disabled={isApproved || dirty}
            style={S.approveBtn(isApproved || dirty)}
            title={dirty ? 'Save first' : ''}
          >
            {isApproved ? '✓ Approved' : 'Approve'}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error   && <div style={S.errorBox}>⚠ {error}</div>}
      {success && <div style={S.successBox}>✓ {success}</div>}

      {/* Form Details */}
      <div style={S.section}>
        <div style={S.sectionHead}>Form Details</div>
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
                onChange={(e) =>
                  setField('net_weight', e.target.value ? Number(e.target.value) : null)
                }
                placeholder="—" />
            </Field>

            <Field label="Start Loading" disabled={isApproved}>
              <input style={S.input(isApproved)} disabled={isApproved}
                type="datetime-local"
                value={form.start_loading_time ?? ''}
                onChange={(e) => setField('start_loading_time', e.target.value || null)} />
            </Field>

            <Field label="End Loading" disabled={isApproved}>
              <input style={S.input(isApproved)} disabled={isApproved}
                type="datetime-local"
                value={form.end_loading_time ?? ''}
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

      {/* Orders */}
      <div style={S.section}>
        <div style={S.sectionHead}>Orders</div>
        <div style={S.sectionBody}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Invoice No</th>
                <th style={S.th}>Qty</th>
                <th style={S.th}>Dock</th>
                <th style={S.th}>Checked By</th>
                {!isApproved && <th style={{ ...S.th, width: 56 }}></th>}
              </tr>
            </thead>
            <tbody>
              {(form.orders ?? []).map((order, i) => (
                <tr key={i}>
                  <td style={S.td}>
                    <input style={S.tableInput(isApproved)} disabled={isApproved}
                      value={order.invoice_no}
                      onChange={(e) => updateOrder(i, 'invoice_no', e.target.value)}
                      placeholder="INV-001" />
                  </td>
                  <td style={{ ...S.td, width: 80 }}>
                    <input style={S.tableInput(isApproved)} disabled={isApproved}
                      type="number"
                      value={order.quantity ?? ''}
                      onChange={(e) =>
                        updateOrder(i, 'quantity', e.target.value ? Number(e.target.value) : null)
                      }
                      placeholder="0" />
                  </td>
                  <td style={S.td}>
                    <input style={S.tableInput(isApproved)} disabled={isApproved}
                      value={order.dock_no}
                      onChange={(e) => updateOrder(i, 'dock_no', e.target.value)}
                      placeholder="D-01" />
                  </td>
                  <td style={S.td}>
                    <input style={S.tableInput(isApproved)} disabled={isApproved}
                      value={order.checked_by}
                      onChange={(e) => updateOrder(i, 'checked_by', e.target.value)}
                      placeholder="Name" />
                  </td>
                  {!isApproved && (
                    <td style={S.td}>
                      <button style={S.delBtn} onClick={() => deleteOrder(i)}>Del</button>
                    </td>
                  )}
                </tr>
              ))}
              {(form.orders ?? []).length === 0 && (
                <tr>
                  <td colSpan={isApproved ? 4 : 5}
                    style={{ ...S.td, textAlign: 'center', color: '#1e2533', fontSize: 12, padding: 20 }}>
                    No orders
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {!isApproved && (
            <button style={S.addRowBtn} onClick={addOrder}>+ Add Order</button>
          )}
        </div>
      </div>

      {/* Checklist */}
      <div style={S.section}>
        <div style={S.sectionHead}>Checklist</div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={{ ...S.th, paddingLeft: 16 }}>Item</th>
              <th style={{ ...S.th, width: 64, textAlign: 'center' as const }}>Pass</th>
              <th style={{ ...S.th, width: 64, textAlign: 'center' as const }}>Fail</th>
            </tr>
          </thead>
          <tbody>
            {form.items?.map((item) => {
              const isSaving   = savingItems.has(item.id)
              const isDisabled = isApproved || isSaving
              return (
                <tr key={item.id}>
                  <td style={{ ...S.td, paddingLeft: 16, fontSize: 13, color: '#a0aec0' }}>
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

      {/* Signatures */}
      <div style={S.section}>
        <div style={S.sectionHead}>Signatures</div>
        <div style={S.sectionBody}>
          <div style={S.signaturesRow}>
            {ALL_SIGNATURE_ROLES.map((role) => {
              const isRequired = (REQUIRED_ROLES as readonly string[]).includes(role)
              return (
                <div key={role} style={S.signatureCard(isRequired)}>
                  <div style={S.signatureRole}>{role}</div>
                  <div style={isRequired ? S.requiredTag : S.optionalTag}>
                    {isRequired ? 'required' : 'optional'}
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
      </div>

    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({
  label,
  children,
  disabled,
}: {
  label: string
  children: React.ReactNode
  disabled: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{
        fontSize: 9, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: disabled ? '#2d3748' : '#4a5568', fontWeight: 700,
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}
