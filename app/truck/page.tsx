'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { QRScanner } from '@/components/forms/QRScanner'
import { Camera } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type FormStatus = 'draft' | 'submitted' | 'approved'

interface TruckFormSummary {
  id: string
  form_no: string
  truck_no: string
  driver_name: string
  status: FormStatus
  date: string
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  page: {
    padding: '32px 24px',
    maxWidth: 800,
    margin: '0 auto',
    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
    backgroundColor: '#0f1117',
    minHeight: '100vh',
    color: '#e2e8f0',
  } as React.CSSProperties,

  title: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: '#f7c948',
    marginBottom: 24,
  } as React.CSSProperties,

  inputRow: {
    display: 'flex',
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,

  input: {
    flex: 1,
    minWidth: 160,
    padding: '10px 14px',
    fontSize: 14,
    background: '#171923',
    border: '1px solid #2d3748',
    borderRadius: 6,
    color: '#e2e8f0',
    fontFamily: 'inherit',
    outline: 'none',
  } as React.CSSProperties,

  btn: (variant: 'default' | 'primary' | 'danger' = 'default') =>
    ({
      padding: '10px 18px',
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
      border: 'none',
      borderRadius: 6,
      cursor: 'pointer',
      fontFamily: 'inherit',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      background:
        variant === 'primary'
          ? '#f7c948'
          : variant === 'danger'
          ? '#742a2a'
          : '#2d3748',
      color:
        variant === 'primary' ? '#0f1117' : '#e2e8f0',
      transition: 'opacity 0.15s ease',
    } as React.CSSProperties),

  message: (type: 'error' | 'info') =>
    ({
      padding: '10px 14px',
      marginBottom: 12,
      borderRadius: 6,
      fontSize: 13,
      background: type === 'error' ? '#3b1515' : '#1a2a3a',
      color: type === 'error' ? '#fc8181' : '#63b3ed',
      border: `1px solid ${type === 'error' ? '#742a2a' : '#2b4e6e'}`,
    } as React.CSSProperties),

  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginTop: 8,
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

  openBtn: {
    padding: '6px 14px',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    border: '1px solid #2d3748',
    borderRadius: 4,
    cursor: 'pointer',
    background: 'transparent',
    color: '#f7c948',
    fontFamily: 'inherit',
  } as React.CSSProperties,

  statusBadge: (status: FormStatus) =>
    ({
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
      background:
        status === 'approved'
          ? '#1a3a2a'
          : status === 'submitted'
          ? '#2a2010'
          : '#1a1a2a',
      color:
        status === 'approved'
          ? '#48bb78'
          : status === 'submitted'
          ? '#f7c948'
          : '#a0aec0',
      border: `1px solid ${
        status === 'approved'
          ? '#276749'
          : status === 'submitted'
          ? '#b7791f'
          : '#4a5568'
      }`,
    } as React.CSSProperties),
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TruckSearchPage() {
  const router = useRouter()

  // ✅ All hooks at top level
  const [truckNo, setTruckNo]       = useState('')
  const [driverName, setDriverName] = useState('')
  const [loading, setLoading]       = useState(false)
  const [forms, setForms]           = useState<TruckFormSummary[]>([])
  const [message, setMessage]       = useState('')
  const [showScanner, setShowScanner] = useState(false)
  

  const scannedRef = useRef(false)
  
  const [statusFilter, setStatusFilter] = useState<FormStatus | 'all'>('all')
  const [dateFilter, setDateFilter] = useState('')

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const searchByValue = async (value: string) => {
    if (!value) {
      setMessage('Please enter truck number')
      return
    }

    setLoading(true)
    setMessage('')
    setForms([])

    try {
      const res  = await fetch(`/api/truck/forms/search?truck_no=${value}&status=${statusFilter}&date=${dateFilter}`)
      const data = await res.json()

      if (data.success) {
        setForms(data.data)
        if (data.data.length === 0) setMessage('No forms found')
      } else {
        setMessage(data.message || 'No forms found')
      }
    } catch {
      setMessage('Error searching form')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    searchByValue(truckNo.trim().toUpperCase())
  }

  const handleCreate = async () => {
    const cleanTruckNo   = truckNo.trim().toUpperCase()
    const cleanDriverName = driverName.trim()

    if (!cleanTruckNo) {
      setMessage('Please enter truck number')
      return
    }
    if (!cleanDriverName) {
      setMessage('Please enter driver name')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const res  = await fetch('/api/truck/forms', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          truck_no:    cleanTruckNo,
          driver_name: cleanDriverName,
        }),
      })
      const data = await res.json()

      if (data.success) {
        router.push(`/truck/forms/${data.data.id}`)
      } else {
        setMessage(data.error || 'Create failed')
      }
    } catch {
      setMessage('Error creating form')
    } finally {
      setLoading(false)
    }
  }

  const handleScan = (value: string) => {
    if (scannedRef.current) return

    scannedRef.current = true

    const cleaned = value.replace(/\s/g, '').toUpperCase()
    setTruckNo(cleaned)
    setShowScanner(false)
    searchByValue(cleaned)

    setTimeout(() => {
      scannedRef.current = false
    }, 1000)
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={styles.page}>
      <div style={styles.title}>🚚 Truck Exit System</div>

      {/* Input row */}
      <div style={styles.inputRow}>
        <input
          value={truckNo}
          onChange={(e) => setTruckNo(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Truck number"
          style={styles.input}
        />

        <input
          value={driverName}
          onChange={(e) => setDriverName(e.target.value)}
          placeholder="Driver name"
          style={styles.input}
        />
      </div>

      {/* Action buttons */}
      <div style={styles.inputRow}>
        <button onClick={() => setShowScanner(true)} style={styles.btn()}>
          <Camera size={14} /> Scan QR
        </button>

        <button onClick={handleSearch} disabled={loading} style={styles.btn()}>
          🔍 Search
        </button>

        <button onClick={handleCreate} disabled={loading} style={styles.btn('primary')}>
          ➕ Create
        </button>
      </div>
      -----
      <div style={styles.inputRow}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          style={styles.input}
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={styles.input}
        />
      </div>

      {/* Message */}
      {message && (
        <div style={styles.message('error')}>{message}</div>
      )}

      {/* Loading */}
      {loading && (
        <div style={styles.message('info')}>Loading…</div>
      )}

      {/* Results table */}
      {forms.length > 0 && (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Form No</th>
              <th style={styles.th}>Truck No</th>
              <th style={styles.th}>Driver</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {forms.map((f) => (
              <tr key={f.id}>
                <td style={styles.td}>{f.form_no}</td>
                <td style={styles.td}>{f.truck_no}</td>
                <td style={styles.td}>{f.driver_name}</td>
                <td style={styles.tdCenter}>
                  <span style={styles.statusBadge(f.status)}>{f.status}</span>
                </td>
                <td style={styles.td}>{f.date}</td>
                <td style={styles.tdCenter}>
                  <button
                    onClick={() => router.push(`/truck/forms/${f.id}`)}
                    style={styles.openBtn}
                  >
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* QR Scanner */}
      {showScanner && (
        <QRScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  )
}
