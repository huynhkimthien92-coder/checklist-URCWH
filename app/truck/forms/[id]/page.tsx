'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { SignaturePad } from '@/components/forms>import { SignaturePad } from '@/components/forms/SignaturePad'
          <tr>
            <th style={cellStyle}>Item</th>
            <th style={cellStyle}>Pass</th>
            <th style={cellStyle}>Fail</th>
          </tr>
        </thead>

        <tbody>
          {form.items?.map((item: any) => (
            <tr key={item.id}>
              <td style={cellStyle}>{item.label_vi || item.label_en}</td>

              <td style={cellStyle}>
                <button
                  disabled={isApproved}
                  onClick={() => updateItem(item.id, 'pass')}
                  style={{
                    background: item.status === 'pass' ? 'green' : '#eee',
                    color: item.status === 'pass' ? 'white' : 'black'
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
                    background: item.status === 'fail' ? 'red' : '#eee',
                    color: item.status === 'fail' ? 'white' : 'black'
                  }}
                >
                  ❌
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ✅ SIGNATURE */}
      <h3 style={{ marginTop: 30 }}>Signature</h3>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {['driver', 'warehouse', 'security'].map((role) => {
          const signature = form.signatures?.[role]

          return (
            <div key={role} style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>
                {role}
              </div>

              <SignaturePad
                label={`Ký ${role}`}
                existingSignature={signature?.signature_url || null}
                disabled={isApproved}
                onSave={async (url) => {
                  await fetch('/api/truck/sign', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      form_id: form.id,
                      role,
                      user_name: 'Demo User',

                      // ✅ từ Cloudinary
                      signature_url: url,

                      signed_by_role: role
                    })
                  })

                  loadForm()
                }}
              />
            </div>
          )
        })}
      </div>

      {/* ✅ APPROVE */}
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
          ✅ Approve
        </button>
      </div>
    </div>
  )
}

// ✅ STYLE
const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  marginTop: 10
}

const cellStyle = {
  border: '1px solid #ddd',
  padding: 8,
  textAlign: 'center' as const
}


export default function TruckFormPage() {
  const { id } = useParams()

  const [form, setForm] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // ✅ LOAD FORM
  const loadForm = async () => {
    setLoading(true)

    try {
      const res = await fetch(`/api/truck/forms/${id}`)
      const data = await res.json()
      setForm(data.data)
    } catch (err) {
      console.error(err)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadForm()
  }, [])

  // ✅ UPDATE CHECKLIST
  const updateItem = async (itemId: string, status: string) => {
    await fetch('/api/truck/items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ id: itemId, status }]
      })
    })

    loadForm()
  }

  // ✅ APPROVE
  const approve = async () => {
    const res = await fetch(`/api/truck/forms/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' })
    })

    const data = await res.json()

    if (!data.success) {
      alert(data.error)
      return
    }

    loadForm()
  }

  if (loading) return <div>Loading...</div>
  if (!form) return <div>No data</div>

  const isApproved = form.status === 'approved'

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: '0 auto' }}>
      <h2>🚚 Truck Exit Form</h2>

      {/* ✅ HEADER */}
      <div style={{ marginBottom: 20 }}>
        <div>Form No: {form.form_no}</div>
        <div>Truck No: {form.truck_no}</div>
        <div>Driver: {form.driver_name}</div>
        <div>Status: {form.status}</div>
      </div>

      {/* ✅ ORDERS */}
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
          {form.orders?.map((o: any, i: number) => (
            <tr key={i}>
              <td style={cellStyle}>{o.invoice_no}</td>
              <td style={cellStyle}>{o.quantity}</td>
              <td style={cellStyle}>{o.dock_no}</td>
              <td style={cellStyle}>{o.checked_by}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ✅ CHECKLIST */}
      <h3 style={{ marginTop: 30 }}>Checklist</h3>

      <table style={tableStyle}>
