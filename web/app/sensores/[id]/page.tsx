'use client'

import { useState, useEffect, use } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '@/lib/firebase'
import { NavBar } from '@/components/nav-bar'
import { FooterDisclaimer } from '@/components/footer-disclaimer'
import Link from 'next/link'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { ArrowLeft, Wifi, WifiOff } from 'lucide-react'

// ─── FONT CONFIG ─────────────────────────────────────────────────────────────
const FONT_IMPORT = 'Google+Sans:wght@300;400;500;600;700'
const FONT_DISPLAY = "'Google Sans', sans-serif"

// ─── SENSOR META ─────────────────────────────────────────────────────────────
const SENSOR_META: Record<string, { name: string; campus: string; location: string }> = {
  device1: { name: 'Sensor CO₂ UCC', campus: 'Campus Universitario', location: 'Prueba inicial' },
  device2: { name: 'Sensor Aula 204', campus: 'Campus Centro', location: 'Aula 204' },
  device3: { name: 'Sensor Biblioteca', campus: 'Campus Universitario', location: 'Biblioteca' },
  device4: { name: 'Sensor Laboratorio', campus: 'Campus Universitario', location: 'Laboratorio' },
}

interface TelemetryEntry { 'Co2-ppm': number; ts: number }
interface Reading { co2: number; ts: number; time: string }

function co2Status(ppm: number) {
  if (ppm < 800) return { label: 'Bueno', color: '#34d399' }
  if (ppm <= 1200) return { label: 'Atención', color: '#fbbf24' }
  return { label: 'Crítico', color: '#ef4444' }
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// ─── CUSTOM TOOLTIP ──────────────────────────────────────────────────────────
function ChartTooltip({ active, payload }: { active?: boolean; payload?: { value: number; payload: Reading }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  const status = co2Status(d.value)
  return (
    <div
      className="rounded-xl border border-zinc-700/60 bg-zinc-900/95 backdrop-blur-sm px-3.5 py-2.5 shadow-xl"
      style={{ fontFamily: FONT_DISPLAY }}
    >
      <p className="text-xs text-zinc-500 mb-1">{d.payload.time}</p>
      <p className="text-sm font-bold" style={{ color: status.color }}>
        {d.value} ppm
      </p>
      <p className="text-xs" style={{ color: status.color }}>{status.label}</p>
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function SensorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const meta = SENSOR_META[id]

  const [readings, setReadings] = useState<Reading[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // El sensor sobrescribe /deviceN con la última medición (sin historial en Firebase).
    // Acumulamos las lecturas que llegan mientras la página está abierta (máx. 20).
    const r = ref(db, id)
    const unsub = onValue(r, (snap) => {
      const latest = snap.val() as TelemetryEntry | null
      if (!latest || typeof latest['Co2-ppm'] !== 'number') return
      const reading = { co2: latest['Co2-ppm'], ts: latest.ts, time: formatTime(latest.ts) }
      setReadings((prev) =>
        prev.length && prev[prev.length - 1].ts === reading.ts
          ? prev
          : [...prev, reading].slice(-20)
      )
    })
    return () => unsub()
  }, [id])

  const latest = readings[readings.length - 1]
  const status = latest ? co2Status(latest.co2) : null
  const connected = readings.length > 0

  if (!meta) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <NavBar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-zinc-500">Sensor no encontrado.</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${FONT_IMPORT}&display=swap');
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <NavBar />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-14">

        {/* ── Back link ── */}
        <div style={{ animation: mounted ? 'fadeSlideUp 0.4s ease both' : 'none' }} className="mb-6">
          <Link
            href="/sensores"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            style={{ fontFamily: FONT_DISPLAY }}
          >
            <ArrowLeft size={14} />
            Volver a Sensores
          </Link>
        </div>

        {/* ── Header ── */}
        <div
          style={{ animation: mounted ? 'fadeSlideUp 0.5s ease 60ms both' : 'none' }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              {connected ? (
                <>
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"
                    style={{ boxShadow: '0 0 6px #34d39980' }}
                  />
                  <Wifi size={12} className="text-emerald-500" />
                </>
              ) : (
                <WifiOff size={12} className="text-zinc-600" />
              )}
              <span
                className="text-xs font-semibold text-zinc-400 uppercase tracking-[0.15em]"
                style={{ fontFamily: FONT_DISPLAY }}
              >
                {id} · {connected ? 'En línea' : 'Sin conexión'}
              </span>
            </div>
            <h1
              className="text-3xl sm:text-4xl font-bold text-zinc-50 tracking-tight mb-1"
              style={{ fontFamily: FONT_DISPLAY }}
            >
              {meta.name}
            </h1>
            <p className="text-zinc-500 text-sm">{meta.campus} · {meta.location}</p>
          </div>

          {/* Current CO2 badge */}
          {latest && (
            <div
              className="flex-shrink-0 rounded-2xl border px-6 py-4 text-center"
              style={{
                borderColor: `${status?.color}30`,
                backgroundColor: `${status?.color}0a`,
              }}
            >
              <p className="text-xs text-zinc-500 mb-1" style={{ fontFamily: FONT_DISPLAY }}>CO₂ actual</p>
              <p
                className="text-5xl font-bold tabular-nums leading-none mb-1"
                style={{ color: status?.color, fontFamily: FONT_DISPLAY }}
              >
                {latest.co2}
              </p>
              <p className="text-sm text-zinc-500 mb-2">ppm</p>
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
            </div>
          )}
        </div>

        {/* ── Chart ── */}
        <div
          style={{ animation: mounted ? 'fadeSlideUp 0.5s ease 120ms both' : 'none' }}
          className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-5 sm:p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-lg font-bold text-zinc-100"
              style={{ fontFamily: FONT_DISPLAY }}
            >
              Historial — últimas {readings.length} lecturas
            </h2>
            <div className="flex items-center gap-3 text-xs text-zinc-600" style={{ fontFamily: FONT_DISPLAY }}>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> &lt;800</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> 800–1200</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> &gt;1200</span>
            </div>
          </div>

          {readings.length === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <p className="text-zinc-600 text-sm">Sin datos disponibles</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={readings} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tick={{ fill: '#52525b', fontSize: 11, fontFamily: FONT_DISPLAY }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: '#52525b', fontSize: 11, fontFamily: FONT_DISPLAY }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}`}
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<ChartTooltip />} />
                {/* Reference lines for thresholds */}
                <ReferenceLine y={800} stroke="#fbbf2440" strokeDasharray="4 4" />
                <ReferenceLine y={1200} stroke="#ef444440" strokeDasharray="4 4" />
                <Line
                  type="monotone"
                  dataKey="co2"
                  stroke="#34d399"
                  strokeWidth={2}
                  dot={{ fill: '#34d399', r: 3, strokeWidth: 0 }}
                  activeDot={{ fill: '#34d399', r: 5, strokeWidth: 0 }}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Stats row ── */}
        {readings.length > 0 && (
          <div
            style={{ animation: mounted ? 'fadeSlideUp 0.5s ease 180ms both' : 'none' }}
            className="grid grid-cols-3 gap-3 sm:gap-4 mt-4"
          >
            {[
              { label: 'Promedio', value: Math.round(readings.reduce((a, r) => a + r.co2, 0) / readings.length) },
              { label: 'Máximo', value: Math.max(...readings.map((r) => r.co2)) },
              { label: 'Mínimo', value: Math.min(...readings.map((r) => r.co2)) },
            ].map((stat) => {
              const s = co2Status(stat.value)
              return (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-4 sm:p-5 text-center"
                >
                  <p className="text-xs text-zinc-500 mb-2" style={{ fontFamily: FONT_DISPLAY }}>
                    {stat.label}
                  </p>
                  <p
                    className="text-2xl font-bold tabular-nums"
                    style={{ color: s.color, fontFamily: FONT_DISPLAY }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs text-zinc-600 mt-0.5">ppm</p>
                </div>
              )
            })}
          </div>
        )}

      </main>

      <FooterDisclaimer />
    </div>
  )
}
