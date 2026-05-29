"use client"

import { useState, useEffect } from "react"

interface LockCountdownProps {
  lockTime: string // ISO string
}

function formatDuration(ms: number): string {
  if (ms <= 0) return "Locked"
  const totalSecs = Math.floor(ms / 1000)
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60
  if (h > 0) return `${h}h ${m}m until lock`
  if (m > 0) return `${m}m ${s}s until lock`
  return `${s}s until lock`
}

export default function LockCountdown({ lockTime }: LockCountdownProps) {
  const [mounted, setMounted] = useState(false)
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    setMounted(true)
    const lock = new Date(lockTime).getTime()

    function tick() {
      setRemaining(Math.max(0, lock - Date.now()))
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [lockTime])

  // Render nothing until client mount to avoid hydration mismatch
  if (!mounted) return null

  return (
    <span className="text-xs text-amber-600">{formatDuration(remaining)}</span>
  )
}
