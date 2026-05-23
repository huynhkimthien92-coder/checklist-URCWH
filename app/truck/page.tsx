'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { QRScanner } from '@/components/forms/QRScanner'
import { Camera } from 'lucide-react'

export default function TruckSearchPage() {
  const router = useRouter()

  const [truckNo, setTruckNo] = useState('')
  const [loading, setLoading] = useState(false)
  const [forms, setForms] = useState<any[]>([])
  const [message, setMessage] = useState('')
  const [showScanner, setShowScanner] = useState(false)

  // ✅ chống scan nhiều lần
  const scannedRef = useRef(false)

  // ✅ SEARCH (dùng chung)
  const handleSearchWithValue = async (value: string) => {
    if (!value) {
      setMessage('Please enter truck number')
      return
    }

    setLoading(true)
    setMessage('')
    setForms([])

    try {
      const res = await fetch(
        `/api/truck/forms/search?truck_no=${value}`
      )

      const data = await res.json()

      if (data.success) {
        setForms(data.data)
      } else {
        setMessage(data.message || 'No forms found')
      }
    } catch {
      setMessage('Error searching form')
    }

    setLoading(false)
  }

  // ✅ SEARCH từ input
  const handleSearch = () => {
    const cleaned = truckNo.trim().toUpperCase()
    handleSearchWithValue(cleaned)
  }

  // ✅ CREATE
  const handleCreate = async () => {
    if (!truckNo.trim()) {
      setMessage('Please enter truck number')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/truck/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          truck_no: truckNo.trim().toUpperCase(),
          driver_name: ''
        })
      })

      const data = await res.json()

      if (data.success) {
        router.push(`/truck/forms/${data.data.id}`)
      } else {
        setMessage(data.error || 'Create failed')
      }
    } catch {
      setMessage('Error creating form')
    }

    setLoading(false)
  }

  // ✅ SCAN HANDLER (ANTI DOUBLE TRIGGER)
  const handleScan = (value: string) => {
    if (scannedRef.current) return // 🔥 chặn double trigger

    scannedRef.current = true

    const cleaned = value
      .replace(/\s/g, '')
      .toUpperCase()

    setTruckNo(cleaned)
    setShowScanner(false)

    // ✅ auto search
    handleSearchWithValue(cleaned)

    // ✅ reset flag sau 1s để dùng lại
    setTimeout(() => {
      scannedRef.current = false
    }, 1000)
  }

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h2>🚚 Truck Exit System</h2>

      {/* ✅ SEARCH INPUT */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input
          value={truckNo}
          onChange={(e) =>
            setTruckNo(e.target.value.toUpperCase())
          }
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Enter truck number"
          style={{
            flex: 1,
            padding: 10,
            fontSize: 16,
            border: '1px solid #ccc'
          }}
        />

        {/* ✅ SCAN */}
        <button onClick={() => setShowScanner(true)}>
          <Camera size={16} /> Scan
        </button>

        <button onClick={handleSearch} disabled={loading}>
          🔍 Search
        </button>

        <button onClick={handleCreate} disabled={loading}>
          ➕ Create
        </button>
      </div>

      {/* ✅ MESSAGE */}
      {message && (
        <div style={{ marginBottom: 10, color: 'red' }}>
          {message}
        </div>
      )}

      {/* ✅ LOADING */}
      {loading && <div>Loading...</div>}

      {/* ✅ RESULT TABLE */}
      {forms.length > 0 && (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}
        >
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={cellStyle}>Form No</th>
              <th style={cellStyle}>Truck No</th>
              <th style={cellStyle}>Status</th>
              <th style={cellStyle}>Date</th>
              <th style={cellStyle}>Action</th>
            </tr>
          </thead>

          <tbody>
            {forms.map((f, index) => (
              <tr
                key={f.id}
                style={{
                  background:
                    index === 0 ? '#e6f7ff' : 'transparent'
                }}
              >
                <td style={cellStyle}>{f.form_no}</td>
                <td style={cellStyle}>{f.truck_no}</td>
                <td style={cellStyle}>
                  <StatusBadge status={f.status} />
                </td>
                <td style={cellStyle}>{f.date}</td>
                <td style={cellStyle}>
                  <button
                    onClick={() =>
                      router.push(`/truck/forms/${f.id}`)
                    }
                  >
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ✅ QR SCANNER */}
      {showScanner && (
        <QRScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  )
}

const cellStyle = {
  border: '1px solid #ddd',
  padding: 8,
  textAlign: 'center' as const
}

// ✅ STATUS BADGE
function StatusBadge({ status }: { status: string }) {
  let color = '#999'

  if (status === 'draft') color = 'gray'
  if (status === 'submitted') color = 'orange'
  if (status === 'approved') color = 'green'

  return (
    <span
      style={{
        padding: '4px 8px',
        borderRadius: 4,
        background: color,
        color: 'white',
        fontSize: 12
      }}
    >
      {status}
    </span>
  )
}
