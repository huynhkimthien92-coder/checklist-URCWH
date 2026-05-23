'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { SignaturePad } from '@/components/forms/SignaturePad'

// ─── Types ───────────────────────────────────────────────────

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

// ─── Constants ───────────────────────────────────────────────

const SIGNATURE_ROLES = ['driver', 'warehouse', 'security'] as const
type SignatureRole = (typeof SIGNATURE_ROLES)[number]

// ─── Component ───────────────────────────────────────────────

export default function TruckFormPage() {
  const params = useParams()
  const id = params?.id as string

  const [form, setForm] = useState<TruckForm | null>(null)
  const [loading, setLoading] = useState(true)

  const loadForm = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/truck/forms/${id}`)
      const data = await res.json()
      setForm(data.data)
    } catch (err) {
      console.error('Failed to load form:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadForm()
  }, [id])

  // ✅ checklist update
  const updateItem = async (
    itemId: string,
    status: 'pass' | 'fail'
  ) => {
    await fetch('/api/truck/items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ id: itemId, status }]
      })
    })
    loadForm()
  }

  // ✅ save signature
  const saveSignature = async (
    role: SignatureRole,
    url: string
  ) => {
    await fetch('/api/truck/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        form_id: form?.id,
        role,
        user_name: 'Demo User',
        signature_url: url,
        signed_by_role: role
      })
    })
    loadForm()
  }

  // ✅ approve
  const approve = async () => {
    const res = await fetch(
      `/api/truck/forms/${id}/status`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' })
      }
    )

    const data = await res.json()

    if (!data.success) {
      alert(data.error)
      return
    }

    loadForm()
  }

  // ─── states ────────────────────────────────────────────────

  if (loading) {
    return <div style={loadingStyle}>Loading…</div>
  }

  if (!form) {
    return <div style={loadingStyle}>No data</div>
  }

  const isApproved = form.status === 'approved'

  // ─── Render ────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      <h2>🚚 Truck Exit Form</h2>

      {/* HEADER */}
      <div style={{ marginBottom: 20 }}>
        <div>Form No: {form.form_no}</div>
        <div>Truck No: {form.truck_no}</div>
        <div>Driver: {form.driver_name}</div>
        <div>Status: {form.status}</div>
      </div>

      {/* ORDERS */}
      <h3>Orders</h3>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={cellStyle}>Invoice</th>
            <th style={cellStyle}>Qty</th>
            <th style={cellStyle}>Dock</th>
            <th style={cellStyle}>Checked By</th>
          </tr>
        </thead>

        <tbody>
          {form.orders?.map((o, i) => (
            <tr key={i}>
              <td style={cellStyle}>{o.invoice_no}</td>
              <td style={cellStyle}>{o.quantity}</td>
              <td style={cellStyle}>{o.dock_no}</td>
              <td style={cellStyle}>{o.checked_by}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* CHECKLIST */}
      <h3 style={{ marginTop: 30 }}>Checklist</h3>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={cellStyle}>Item</th>
            <th style={cellStyle}>Pass</th>
            <th style={cellStyle}>Fail</th>
          </tr>
        </thead>

        <tbody>
          {form.items?.map((item) => (
            <tr key={item.id}>
              <td style={cellStyle}>
                {item.label_vi || item.label_en}
              </td>

              <td style={cellStyle}>
                <button
                  disabled={isApproved}
                  onClick={() => updateItem(item.id, 'pass')}
                  style={{
                    background:
                      item.status === 'pass' ? 'green' : '#eee',
                    color:
                      item.status === 'pass' ? 'white' : 'black'
                  }}
                >
                  ✅
                </button>
              </td>

              <td style={cellStyle}>
                <button
                  disabled={isApproved}
                  onClick={() => updateItem(item.id, 'fail')}
                  style={{
                    background:
                      item.status === 'fail' ? 'red' : '#eee',
                    color:
                      item.status === 'fail' ? 'white' : 'black'
                  }}
                >
                  ❌
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* SIGNATURE */}
      <h3 style={{ marginTop: 30 }}>Signature</h3>

      <div style={{ display: 'flex', gap: 20 }}>
        {SIGNATURE_ROLES.map((role) => (
          <div key={role}>
            <div>{role}</div>

            <SignaturePad
              label={`Sign ${role}`}
              existingSignature={
                form.signatures?.[role]?.signature_url || null
              }
              disabled={isApproved}
              onSave={(url) => saveSignature(role, url)}
            />
          </div>
        ))}
      </div>

      {/* APPROVE */}
      <div style={{ marginTop: 30 }}>
        <button
          disabled={isApproved}
          onClick={approve}
          style={{
            padding: '10px 20px',
            background: isApproved ? '#999' : 'green',
            color: 'white',
            border: 'none'
          }}
        >
          {isApproved ? 'Approved' : 'Approve'}
        </button>
      </div>
    </div>
  )
}

// ─── styles ────────────────────────────────────────────────

const pageStyle = {
  padding: 20,
  maxWidth: 900,
  margin: '0 auto'
}

const loadingStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh'
}

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse' as const
}

const cellStyle = {
  border: '1px solid #ddd',
  padding: 8
}
