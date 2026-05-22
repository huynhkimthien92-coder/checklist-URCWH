'use client'

import { useRef, useState, useEffect } from 'react'
import { Issue } from '@/types/issue'
import { IssueMarker } from '@/components/5s/IssueMarker'
import { MapHeatmap } from '@/components/5s/MapHeatmap'

type Props = {
  issues: Issue[]
  selectedIssue?: Issue | null
  onSelect: (issue: Issue) => void
  onAdd: (pos: { x: number; y: number }) => void
}

export function MapView({
  issues,
  selectedIssue,
  onSelect,
  onAdd
}: Props) {

  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const [showHeatmap, setShowHeatmap] = useState(true)

  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  const [dragging, setDragging] = useState(false)
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 })

  const [lastTouchDist, setLastTouchDist] = useState(0)
  const [lastTouchCenter, setLastTouchCenter] = useState<{ x: number; y: number } | null>(null)

  // ✅ ===== PRO: DETECT ISSUE MỚI THEO created_at =====
  const lastSeenTime = useRef<number>(Date.now())
  const isFirstLoad = useRef(true)
  const [newIssues, setNewIssues] = useState<string[]>([])

  useEffect(() => {
    if (!issues || issues.length === 0) return

    // ✅ bỏ qua lần load đầu
    if (isFirstLoad.current) {
      isFirstLoad.current = false

      const maxTime = Math.max(
        ...issues.map(i => {
          if (!i.created_at) return 0
          const t = new Date(i.created_at).getTime()
          return isNaN(t) ? 0 : t
        })
      )



      lastSeenTime.current = maxTime
      return
    }

    // ✅ detect issue mới
    const added = issues.filter(i => {
      if (!i.created_at) return false

      const t = new Date(i.created_at).getTime()

      if (isNaN(t)) return false

      return t > lastSeenTime.current
    })

    if (added.length > 0) {
      setNewIssues(added.map(i => i.id))
    }

    // ✅ update mốc mới nhất
    const maxTime = Math.max(
      ...issues.map(i => new Date(i.created_at).getTime())
    )

    lastSeenTime.current = maxTime

  }, [issues])

  // ✅ auto clear highlight sau 10s
  useEffect(() => {
    if (newIssues.length === 0) return

    const timer = setTimeout(() => {
      setNewIssues([])
    }, 10000)

    return () => clearTimeout(timer)
  }, [newIssues])

  // ===== HELPER =====
  const getDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const getCenter = (touches: React.TouchList) => ({
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2
  })

  // ===== ZOOM =====
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    setZoom(prev => Math.min(Math.max(prev - e.deltaY * 0.001, 0.5), 3))
  }

  // ===== PAN =====
  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true)
    setLastPos({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return

    const dx = e.clientX - lastPos.x
    const dy = e.clientY - lastPos.y

    setPan(prev => ({
      x: prev.x + dx,
      y: prev.y + dy
    }))

    setLastPos({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => setDragging(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      setLastTouchDist(getDistance(e.touches))
      setLastTouchCenter(getCenter(e.touches))
    } else if (e.touches.length === 1) {
      setLastTouchCenter({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()

    if (e.touches.length === 2) {
      const newDist = getDistance(e.touches)
      const scale = newDist / lastTouchDist

      setZoom(prev => Math.min(Math.max(prev * scale, 0.5), 3))
      setLastTouchDist(newDist)
    }

    if (e.touches.length === 1 && lastTouchCenter) {
      const touch = e.touches[0]

      const dx = touch.clientX - lastTouchCenter.x
      const dy = touch.clientY - lastTouchCenter.y

      setPan(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }))

      setLastTouchCenter({
        x: touch.clientX,
        y: touch.clientY
      })
    }
  }

  const handleTouchEnd = () => {
    setLastTouchDist(0)
    setLastTouchCenter(null)
  }

  // ===== CLICK =====
  const handleClick = (e: React.MouseEvent) => {
    if (!imgRef.current) return

    const rect = imgRef.current.getBoundingClientRect()

    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
      onAdd({ x, y })
    }
  }

  return (
    <div className="space-y-2">

      {/* HEADER */}
      <div className="flex justify-between items-center text-sm">
        <div className="font-semibold">5S Map View</div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowHeatmap(prev => !prev)}
            className="px-2 py-1 border rounded text-xs"
          >
            {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
          </button>

          <button
            onClick={() => {
              setZoom(1)
              setPan({ x: 0, y: 0 })
            }}
            className="px-2 py-1 border rounded text-xs"
          >
            Reset
          </button>
        </div>
      </div>

      {/* MAP */}
      <div
        ref={containerRef}
        className="relative w-full h-[500px] border rounded overflow-hidden bg-gray-100"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >

        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'top left'
          }}
          className="absolute top-0 left-0"
        >

          <img
            ref={imgRef}
            src="/map.png"
            alt="map"
            className="block select-none pointer-events-none"
          />

          {/* ✅ HEATMAP */}
          {showHeatmap && (
            <MapHeatmap
              issues={issues.map(i => ({
                ...i,
                x_percent: i.x_percent ?? 0,
                y_percent: i.y_percent ?? 0
              }))}
            />
          )}

          {/* ✅ MARKERS */}
          {issues.map(issue => {

            const x = issue.x_percent ?? 0
            const y = issue.y_percent ?? 0

            const isNew = newIssues.includes(issue.id)

            return (
              <div
                key={issue.id}
                style={{
                  position: 'absolute',
                  left: `${x * 100}%`,
                  top: `${y * 100}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="relative flex items-center justify-center">

                  {isNew && (
                    <>
                      {/* radar outer */}
                      <span className="absolute w-10 h-10 rounded-full bg-red-400 opacity-50 animate-ping" />
                      {/* radar inner */}
                      <span className="absolute w-6 h-6 rounded-full bg-red-500 opacity-80 animate-pulse" />
                    </>
                  )}

                  <div className={isNew ? 'scale-125 z-10' : ''}>
                    <IssueMarker
                      issue={issue}
                      selected={selectedIssue?.id === issue.id}
                      onClick={onSelect}
                    />
                  </div>

                </div>
              </div>
            )
          })}

        </div>

      </div>
    </div>
  )
}
