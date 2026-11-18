'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { ref, onValue } from 'firebase/database'
import { db } from '@/lib/firebase'
import { NavBar } from '@/components/nav-bar'
import { Loader } from '@/components/loader'
import { BarChart3, AlertTriangle, CheckCircle, Wifi } from 'lucide-react'
import { DEVICE_CONFIG, type DeviceMapData } from '@/components/campus-map'

const CampusMap = dynamic(
  () => import('@/components/campus-map').then((m) => m.CampusMap),
  { ssr: false, loading: () => <div className="w-full h-full flex items-center justify-center"><Loader variant="inline" label="Cargando mapa…" /></div> }
)

// ─── FONT CONFIG ─────────────────────────────────────────────────────────────
const FONT_IMPORT  = 'Google+Sans:wght@300;400;500;600;700'
const FONT_DISPLAY = "'Google Sans', sans-serif"
const FONT_BODY    = "'Google Sans', sans-serif"

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface TelemetryEntry { 'Co2-ppm': number; ts: number }

function co2Color(ppm: number | null) {
  if (!ppm) return '#52525b'
  if (ppm < 800)   return '#34d399'
  if (ppm <= 1200) return '#fbbf24'
  return '#ef4444'
}
function co2Status(ppm: number | null) {
  if (!ppm) return 'Sin datos'
  if (ppm < 800)   return 'Bueno'
  if (ppm <= 1200) return 'Atención'
  return 'Crítico'
}
function formatTs(ts: number) {
  return ts ? new Date(ts).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'
}

// ─── SPARK BAR ────────────────────────────────────────────────────────────────
function SparkBar({ value, max, color }: { value: number; max: number; color: string }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.min((value / max) * 100, 100)), 200)
    return () => clearTimeout(t)
  }, [value, max])
  return (
    <div className="h-1 w-full rounded-full bg-white/[0.07] overflow-hidden mt-3">
      <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${width}%`, backgroundColor: color }} />
    </div>
  )
}

// ─── ANIMATED NUMBER ─────────────────────────────────────────────────────────
function AnimatedNumber({ target }: { target: number }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (target === 0) { setVal(0); return }
    let current = 0
    const step = Math.max(Math.ceil(target / 40), 1)
    const interval = setInterval(() => {
      current += step
      if (current >= target) { setVal(target); clearInterval(interval) }
      else setVal(current)
    }, 20)
    return () => clearInterval(interval)
  }, [target])
  return <>{val}</>
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ label, value, unit, sub, color, trendLabel, icon, delay }: {
  label: string; value: number; unit?: string; sub: string; color: string
  trendLabel: string; icon: React.ReactNode; delay: number
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        animationDelay: `${delay}ms`,
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease',
        boxShadow: hovered ? `0 12px 32px rgba(0,0,0,0.35), 0 0 0 1px ${color}28` : '0 2px 8px rgba(0,0,0,0.2)',
        animation: `fadeSlideUp 0.5s ease ${delay}ms both`,
      }}
      className="relative rounded-2xl p-5 sm:p-6 border border-zinc-800/60 bg-zinc-900/70 overflow-hidden cursor-default"
    >
      <div className="absolute top-0 left-0 w-0.5 h-full rounded-l-2xl" style={{ backgroundColor: color }} />
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl transition-opacity duration-300"
        style={{ backgroundColor: color, opacity: hovered ? 0.12 : 0.05 }} />
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-[0.12em]" style={{ fontFamily: FONT_DISPLAY }}>{label}</p>
        <span className="opacity-50">{icon}</span>
      </div>
      <div className="flex items-end gap-1.5 mb-1">
        <p className="text-3xl sm:text-4xl font-bold text-zinc-50 tabular-nums" style={{ fontFamily: FONT_DISPLAY }}>
          <AnimatedNumber target={value} />
        </p>
        {unit && <span className="text-sm text-zinc-500 mb-1">{unit}</span>}
      </div>
      <p className="text-sm text-zinc-400 mb-1">{sub}</p>
      <SparkBar value={value} max={2000} color={color} />
      <div className="mt-2.5 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm text-zinc-400">{trendLabel}</span>
      </div>
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [mounted, setMounted]         = useState(false)
  const [selectedDevice, setSelected] = useState('device1')
  const [readings, setReadings]       = useState<number[]>([])
  const [lastTs, setLastTs]           = useState(0)
  const lastTsRef                     = useRef(0)
  const [devicesData, setDevicesData] = useState<Record<string, { co2: number; ts: number } | null>>({
    device1: null, device2: null, device3: null, device4: null,
  })

  useEffect(() => {
    setMounted(true)
    const unsubs: (() => void)[] = []

    DEVICE_CONFIG.forEach((cfg) => {
      // El sensor sobrescribe /deviceN con la última medición (objeto único, sin historial)
      const r = ref(db, cfg.id)
      const unsub = onValue(r, (snap) => {
        const latest = snap.val() as TelemetryEntry | null
        if (!latest || typeof latest['Co2-ppm'] !== 'number') {
          setDevicesData((prev) => ({ ...prev, [cfg.id]: null }))
          return
        }

        setDevicesData((prev) => ({ ...prev, [cfg.id]: { co2: latest['Co2-ppm'], ts: latest.ts } }))

        // Acumular lecturas de device1 recibidas en esta sesión (máx. 20) para estadísticas
        if (cfg.id === 'device1') {
          if (lastTsRef.current !== latest.ts) {
            lastTsRef.current = latest.ts
            setReadings((prev) => [...prev, latest['Co2-ppm']].slice(-20))
          }
          setLastTs(latest.ts)
        }
      })
      unsubs.push(() => unsub())
    })

    return () => unsubs.forEach((u) => u())
  }, [])

  // Build DeviceMapData array for the map
  const mapDevices: DeviceMapData[] = DEVICE_CONFIG.map((cfg) => {
    const d = devicesData[cfg.id]
    return {
      id:       cfg.id,
      co2:      d?.co2 ?? null,
      status:   d ? co2Status(d.co2) : null,
      color:    co2Color(d?.co2 ?? null),
      lastTime: d ? formatTs(d.ts) : '',
    }
  })

  const d1        = devicesData['device1']
  const currentCO2 = d1?.co2 ?? 0
  const maxCO2    = readings.length ? Math.max(...readings) : 0
  const minCO2    = readings.length ? Math.min(...readings) : 0
  const activeCount = Object.values(devicesData).filter(Boolean).length
  const color     = co2Color(currentCO2 || null)
  const status    = co2Status(currentCO2 || null)

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${FONT_IMPORT}&display=swap');
        :root { --font-display: ${FONT_DISPLAY}; --font-body: ${FONT_BODY}; }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-title { font-family: var(--font-display); }
        .body-font  { font-family: var(--font-body); }
      `}</style>

      <NavBar />

      <main className="body-font flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-14">

        {/* ── Header ── */}
        <div style={{ animation: mounted ? 'fadeSlideUp 0.5s ease both' : 'none' }} className="mb-8 sm:mb-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-[0.15em]" style={{ fontFamily: FONT_DISPLAY }}>
              Datos en tiempo real · Firebase
            </span>
          </div>
          <h1 className="hero-title text-3xl sm:text-4xl md:text-5xl text-zinc-50 font-bold tracking-tight mb-2">Dashboard</h1>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-md">
            Monitoreo de CO₂ en espacios universitarios. Última lectura: {formatTs(lastTs)}
          </p>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
          <StatCard label="CO₂ Actual" value={currentCO2} unit="ppm" sub={`Estado: ${status}`} color={color}
            trendLabel={currentCO2 > 0 ? status : 'Sin datos'} icon={<BarChart3 size={18} color={color} />} delay={80} />
          <StatCard label="CO₂ Máximo" value={maxCO2} unit="ppm" sub="Últimas 20 lecturas" color="#f97316"
            trendLabel={maxCO2 >= 1200 ? 'Nivel crítico' : maxCO2 >= 800 ? 'Nivel moderado' : 'Nivel aceptable'}
            icon={<AlertTriangle size={18} color="#f97316" />} delay={160} />
          <StatCard label="CO₂ Mínimo" value={minCO2} unit="ppm" sub="Últimas 20 lecturas" color="#34d399"
            trendLabel={minCO2 > 0 ? co2Status(minCO2) : 'Sin datos'} icon={<CheckCircle size={18} color="#34d399" />} delay={240} />
          <StatCard label="Sensores Activos" value={activeCount} sub={`de ${DEVICE_CONFIG.length} configurados`} color="#818cf8"
            trendLabel={activeCount === DEVICE_CONFIG.length ? '100% operativos' : `${activeCount} en línea`}
            icon={<Wifi size={18} color="#818cf8" />} delay={320} />
        </div>

        {/* ── Mapa del Campus ── */}
        <div style={{ animation: mounted ? 'fadeSlideUp 0.5s ease 360ms both' : 'none' }} className="mb-8 sm:mb-10">

          {/* Header del mapa */}
          <div className="flex items-center gap-3 mb-4 sm:mb-5">
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight flex-shrink-0" style={{ fontFamily: FONT_DISPLAY }}>
              Mapa del Campus
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-zinc-700/50 to-transparent" />
            <span className="hidden sm:block text-xs text-zinc-500">Av. Armada Argentina 3555, Córdoba</span>
          </div>

          {/* Selector de device */}
          <div className="flex flex-wrap gap-2 mb-3">
            {DEVICE_CONFIG.map((cfg) => {
              const d    = devicesData[cfg.id]
              const clr  = co2Color(d?.co2 ?? null)
              const active = d != null
              const selected = selectedDevice === cfg.id
              return (
                <button
                  key={cfg.id}
                  onClick={() => setSelected(cfg.id)}
                  style={{
                    borderColor: selected ? clr : 'rgba(63,63,70,0.5)',
                    backgroundColor: selected ? `${clr}15` : 'rgba(24,24,27,0.6)',
                    color: selected ? clr : '#71717a',
                    transition: 'all 0.2s ease',
                    fontFamily: FONT_DISPLAY,
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-semibold"
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: clr,
                      boxShadow: active ? `0 0 5px ${clr}80` : 'none',
                      animation: active ? 'pulse 2s ease-in-out infinite' : 'none',
                    }}
                  />
                  <span>{cfg.short}</span>
                  {d && (
                    <span className="text-xs opacity-70 tabular-nums">{d.co2} ppm</span>
                  )}
                  {!d && (
                    <span className="text-xs opacity-40">sin señal</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Mapa + Leyenda */}
          <div className="flex gap-3 sm:gap-4">
            <div
              className="flex-1 rounded-2xl border border-zinc-800/60 bg-zinc-900/60 overflow-hidden"
              style={{ height: 'clamp(360px, 52vh, 540px)' }}
            >
              <CampusMap
                devices={mapDevices}
                selectedId={selectedDevice}
                onSelect={setSelected}
              />
            </div>

            {/* Leyenda */}
            <div className="hidden sm:flex flex-col justify-center gap-4 w-24 flex-shrink-0 pl-1">
              {[
                { label: 'Bueno',    color: '#34d399', sub: '< 800 ppm' },
                { label: 'Atención', color: '#fbbf24', sub: '800–1200'  },
                { label: 'Crítico',  color: '#ef4444', sub: '> 1200 ppm'},
                { label: 'Sin datos',color: '#52525b', sub: '—'         },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}70` }}
                  />
                  <div>
                    <p className="text-xs font-semibold leading-tight" style={{ color: item.color, fontFamily: FONT_DISPLAY }}>{item.label}</p>
                    <p className="text-[10px] text-zinc-600 tabular-nums leading-tight">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
