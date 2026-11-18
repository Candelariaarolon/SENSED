'use client'

import { useState, useEffect } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '@/lib/firebase'
import { NavBar } from '@/components/nav-bar'
import { FooterDisclaimer } from '@/components/footer-disclaimer'
import Link from 'next/link'
import { Search, Wifi, WifiOff, Activity } from 'lucide-react'

// ─── FONT CONFIG ─────────────────────────────────────────────────────────────
const FONT_IMPORT = 'Google+Sans:wght@300;400;500;600;700'
const FONT_DISPLAY = "'Google Sans', sans-serif"

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface TelemetryEntry {
  'Co2-ppm': number
  ts: number
}

interface SensorData {
  co2: number
  ts: number
  connected: boolean
}

interface SensorConfig {
  id: string
  name: string
  campus: string
  location: string
  deviceId: string
}

const SENSORS: SensorConfig[] = [
  { id: 'device1', name: 'Sensor CO₂ UCC', campus: 'Campus Universitario', location: 'Prueba inicial', deviceId: 'device1' },
  { id: 'device2', name: 'Sensor Aula 204', campus: 'Campus Centro', location: 'Aula 204', deviceId: 'device2' },
  { id: 'device3', name: 'Sensor Biblioteca', campus: 'Campus Universitario', location: 'Biblioteca', deviceId: 'device3' },
  { id: 'device4', name: 'Sensor Laboratorio', campus: 'Campus Universitario', location: 'Laboratorio', deviceId: 'device4' },
]

function co2Status(ppm: number): { label: string; color: string; dot: string } {
  if (ppm < 800) return { label: 'Bueno', color: '#34d399', dot: 'bg-emerald-400' }
  if (ppm <= 1200) return { label: 'Atención', color: '#fbbf24', dot: 'bg-yellow-400' }
  return { label: 'Crítico', color: '#ef4444', dot: 'bg-red-400' }
}

function formatTs(ts: number): string {
  return new Date(ts).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// ─── SENSOR CARD ─────────────────────────────────────────────────────────────
function SensorCard({ sensor, data }: { sensor: SensorConfig; data: SensorData | null }) {
  const [hovered, setHovered] = useState(false)
  const connected = data?.connected ?? false
  const status = connected && data ? co2Status(data.co2) : null

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease',
        boxShadow: hovered
          ? connected
            ? `0 12px 32px rgba(0,0,0,0.35), 0 0 0 1px ${status?.color ?? '#34d399'}28`
            : '0 12px 32px rgba(0,0,0,0.25)'
          : '0 2px 8px rgba(0,0,0,0.2)',
        animation: 'fadeSlideUp 0.5s ease both',
      }}
      className="relative rounded-2xl border border-zinc-800/60 bg-zinc-900/70 overflow-hidden"
    >
      {/* Left accent bar */}
      <div
        className="absolute top-0 left-0 w-0.5 h-full rounded-l-2xl"
        style={{ backgroundColor: connected ? (status?.color ?? '#34d399') : '#3f3f46' }}
      />

      <div className="p-5 sm:p-6">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            {connected ? (
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${status?.dot}`}
                style={{ boxShadow: `0 0 6px ${status?.color}80`, animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }}
              />
            ) : (
              <span className="w-2 h-2 rounded-full flex-shrink-0 bg-zinc-600" />
            )}
            <span
              className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400"
              style={{ fontFamily: FONT_DISPLAY }}
            >
              {sensor.deviceId}
            </span>
          </div>
          {connected ? (
            <Wifi size={14} className="text-emerald-500 flex-shrink-0" />
          ) : (
            <WifiOff size={14} className="text-zinc-600 flex-shrink-0" />
          )}
        </div>

        {/* Name */}
        <h3
          className="text-lg font-bold text-zinc-100 mb-1 leading-tight"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {sensor.name}
        </h3>

        {/* Location */}
        <p className="text-sm text-zinc-500 mb-5">
          {sensor.campus} · {sensor.location}
        </p>

        {/* CO2 value */}
        {connected && data ? (
          <>
            <div className="flex items-end gap-2 mb-2">
              <span
                className="text-4xl font-bold tabular-nums"
                style={{ color: status?.color, fontFamily: FONT_DISPLAY }}
              >
                {data.co2}
              </span>
              <span className="text-sm text-zinc-500 mb-1.5">ppm CO₂</span>
            </div>
            {/* Status badge */}
            <div className="flex items-center justify-between">
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold"
                style={{
                  color: status?.color,
                  backgroundColor: `${status?.color}18`,
                  border: `1px solid ${status?.color}30`,
                }}
              >
                {status?.label}
              </span>
              <span className="text-xs text-zinc-600">
                {formatTs(data.ts)}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-zinc-600">
            <Activity size={14} />
            <span className="text-sm">Sin conexión</span>
          </div>
        )}
      </div>

      {/* Footer: Ver detalle button (only for connected sensors) */}
      {connected && (
        <div className="border-t border-zinc-800/50 px-5 sm:px-6 py-3">
          <Link
            href={`/sensores/${sensor.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            style={{ fontFamily: FONT_DISPLAY }}
          >
            Ver detalle
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function SensoresPage() {
  const [sensorData, setSensorData] = useState<Record<string, SensorData | null>>({
    device1: null, device2: null, device3: null, device4: null,
  })
  const [query, setQuery] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const unsubs: (() => void)[] = []

    SENSORS.forEach((sensor) => {
      // El sensor sobrescribe /deviceN con la última medición (objeto único, sin historial)
      const r = ref(db, sensor.id)
      const unsub = onValue(r, (snap) => {
        const latest = snap.val() as TelemetryEntry | null
        if (!latest || typeof latest['Co2-ppm'] !== 'number') {
          setSensorData((prev) => ({ ...prev, [sensor.id]: null }))
          return
        }
        setSensorData((prev) => ({
          ...prev,
          [sensor.id]: { co2: latest['Co2-ppm'], ts: latest.ts, connected: true },
        }))
      })
      unsubs.push(() => unsub())
    })

    return () => unsubs.forEach((u) => u())
  }, [])

  const filtered = SENSORS.filter((s) => {
    if (!query) return true
    const q = query.toLowerCase()
    return (
      s.name.toLowerCase().includes(q) ||
      s.campus.toLowerCase().includes(q) ||
      s.location.toLowerCase().includes(q)
    )
  })

  const connectedCount = Object.values(sensorData).filter((d) => d?.connected).length

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${FONT_IMPORT}&display=swap');
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <NavBar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-14">

        {/* ── Header ── */}
        <div
          style={{ animation: mounted ? 'fadeSlideUp 0.5s ease both' : 'none' }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8 sm:mb-10"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span
                className="text-xs font-semibold text-zinc-400 uppercase tracking-[0.15em]"
                style={{ fontFamily: FONT_DISPLAY }}
              >
                Tiempo real · Firebase
              </span>
            </div>
            <h1
              className="text-3xl sm:text-4xl md:text-5xl text-zinc-50 font-bold tracking-tight mb-2"
              style={{ fontFamily: FONT_DISPLAY }}
            >
              Sensores
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-md">
              Monitoreo de CO₂ en tiempo real. {connectedCount} de {SENSORS.length} sensores activos.
            </p>
          </div>

          {/* Search */}
          <div
            className="relative flex-shrink-0 w-full sm:w-64"
            style={{ animation: mounted ? 'fadeSlideUp 0.5s ease 80ms both' : 'none' }}
          >
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Buscar por nombre, campus…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/60 text-zinc-200 text-sm placeholder-zinc-600 outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              style={{ fontFamily: FONT_DISPLAY }}
            />
          </div>
        </div>

        {/* ── Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((sensor) => (
            <SensorCard key={sensor.id} sensor={sensor} data={sensorData[sensor.id] ?? null} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center">
              <p className="text-zinc-400 text-sm">No se encontraron sensores para &ldquo;{query}&rdquo;</p>
            </div>
          )}
        </div>

      </main>

      <FooterDisclaimer />
    </div>
  )
}
