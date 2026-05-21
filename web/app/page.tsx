'use client'

import Link from 'next/link'
import { NavBar } from '@/components/nav-bar'
import { FooterDisclaimer } from '@/components/footer-disclaimer'
import { useState, useEffect, useRef } from 'react'

// ─── FONT CONFIG ─────────────────────────────────────────────────────────────
const FONT_IMPORT = 'Google+Sans:wght@300;400;500;600;700'
const FONT_DISPLAY = "'Google Sans', sans-serif"
const FONT_BODY = "'Google Sans', sans-serif"

// ─── PARTICLE CANVAS ─────────────────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const particles: { x: number; y: number; r: number; vx: number; vy: number; opacity: number }[] = []

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.4 + 0.1,
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(134,239,172,${p.opacity})`
        ctx.fill()
      })
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(134,239,172,${0.07 * (1 - dist / 120)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.5 }} />
  )
}

// ─── CAPABILITY CARD ─────────────────────────────────────────────────────────
function CapabilityCard({ title, desc, icon, index }: { title: string; desc: string; icon: React.ReactNode; index: number }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        animationDelay: `${index * 80}ms`,
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease, border-color 0.2s ease',
        boxShadow: hovered ? '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(52,211,153,0.1)' : '0 2px 8px rgba(0,0,0,0.15)',
        borderColor: hovered ? 'rgba(52,211,153,0.15)' : 'rgba(63,63,70,0.5)',
      }}
      className="relative rounded-2xl p-6 sm:p-7 border overflow-hidden cursor-default bg-zinc-900/50"
    >
      <div
        className="absolute top-0 left-6 right-6 h-px rounded-full transition-opacity duration-300"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(52,211,153,0.3), transparent)', opacity: hovered ? 1 : 0 }}
      />
      <div className="mb-4">{icon}</div>
      <h3 className="font-semibold mb-2.5 text-sm text-zinc-100" style={{ fontFamily: FONT_DISPLAY }}>{title}</h3>
      <p className="text-zinc-500 text-[13.5px] leading-relaxed">{desc}</p>
    </div>
  )
}

// ─── WORKFLOW STEP ────────────────────────────────────────────────────────────
function WorkflowStep({ num, title, text, isLast, index }: {
  num: string; title: string; text: string; isLast?: boolean; index: number
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ animationDelay: `${index * 100}ms` }}
      className="flex gap-5 sm:gap-6 cursor-default"
    >
      <div className="flex-shrink-0 flex flex-col items-center">
        <div
          style={{
            transform: hovered ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            fontFamily: FONT_DISPLAY,
          }}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-emerald-800/50 bg-emerald-950/60 flex items-center justify-center text-sm font-bold text-emerald-400"
        >
          {num}
        </div>
        {!isLast && <div className="w-px flex-1 mt-3 bg-gradient-to-b from-zinc-700/40 to-transparent min-h-[24px]" />}
      </div>
      <div className={`flex-1 min-w-0 ${isLast ? 'pb-0' : 'pb-8'}`}>
        <h3
          style={{ color: hovered ? '#6ee7b7' : '#e4e4e7', transition: 'color 0.2s ease', fontFamily: FONT_DISPLAY }}
          className="font-semibold mb-1.5 text-[15px]"
        >
          {title}
        </h3>
        <p className="text-zinc-500 text-[13.5px] leading-relaxed">{text}</p>
      </div>
    </div>
  )
}

// ─── CO2 LEVEL CARD ───────────────────────────────────────────────────────────
function CO2LevelCard({ label, range, desc, color, delay }: {
  label: string; range: string; desc: string; color: string; delay: number
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        animationDelay: `${delay}ms`,
        borderColor: hovered ? `${color}30` : 'rgba(63,63,70,0.5)',
        boxShadow: hovered ? `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px ${color}18` : '0 2px 8px rgba(0,0,0,0.15)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease, border-color 0.2s ease',
      }}
      className="relative rounded-2xl p-6 border bg-zinc-900/50 cursor-default overflow-hidden"
    >
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
        style={{ backgroundColor: color, opacity: hovered ? 0.6 : 0.2, transition: 'opacity 0.2s ease' }}
      />
      <div className="flex items-center gap-2.5 mb-3">
        <span className="font-bold text-zinc-100 text-base" style={{ fontFamily: FONT_DISPLAY }}>{label}</span>
      </div>
      <p className="text-2xl font-bold mb-1 tabular-nums" style={{ color, fontFamily: FONT_DISPLAY }}>{range}</p>
      <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${FONT_IMPORT}&display=swap');
        :root { --font-display: ${FONT_DISPLAY}; --font-body: ${FONT_BODY}; }

        @keyframes heroFade {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .hero-title { font-family: var(--font-display); }
        .body-font  { font-family: var(--font-body); }

        .gradient-text {
          background: linear-gradient(135deg, #6ee7b7 0%, #34d399 50%, #a7f3d0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .glow-btn {
          box-shadow: 0 0 16px rgba(52,211,153,0.2), 0 4px 12px rgba(0,0,0,0.35);
          transition: box-shadow 0.25s ease, transform 0.2s ease;
        }
        .glow-btn:hover {
          box-shadow: 0 0 28px rgba(52,211,153,0.35), 0 8px 24px rgba(0,0,0,0.45);
          transform: translateY(-2px);
        }

        .outline-btn {
          transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
        }
        .outline-btn:hover {
          border-color: rgba(52,211,153,0.35);
          background-color: rgba(52,211,153,0.05);
          transform: translateY(-2px);
        }

        .mesh-bg {
          background:
            radial-gradient(ellipse 60% 50% at 20% 10%, rgba(16,100,60,0.15) 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 80% 80%, rgba(30,58,80,0.18) 0%, transparent 70%),
            radial-gradient(ellipse 40% 60% at 50% 40%, rgba(15,40,30,0.12) 0%, transparent 70%),
            #09090b;
        }

        .stat-card {
          transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease;
        }
        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(52,211,153,0.08);
        }
      `}</style>

      <NavBar />

      <main className="flex-1 body-font">

        {/* ── HERO ────────────────────────────────────────────────────────── */}
        <section className="relative mesh-bg overflow-hidden flex-1 flex items-center justify-center min-h-[calc(100vh-64px)]">
          <ParticleCanvas />

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] rounded-full border border-emerald-900/15 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] sm:w-[1100px] sm:h-[1100px] rounded-full border border-emerald-900/8 pointer-events-none" />

          <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 text-center">

            {/* Badge */}
            <div
              style={{ animation: mounted ? 'heroFade 0.6s ease 0.1s both' : 'none' }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-800/40 bg-emerald-950/50 mb-8"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-[0.15em]" style={{ fontFamily: FONT_DISPLAY }}>
                Proyecto universitario · UCC
              </span>
            </div>

            {/* Title */}
            <h1
              style={{ animation: mounted ? 'heroFade 0.7s ease 0.2s both' : 'none' }}
              className="hero-title text-[clamp(4rem,14vw,8rem)] font-extrabold tracking-tight leading-[1.0] mb-5"
            >
              <span className="gradient-text">SENSED</span>
            </h1>

            {/* Subtitle */}
            <p
              style={{ animation: mounted ? 'heroFade 0.7s ease 0.32s both' : 'none' }}
              className="text-zinc-200 text-lg sm:text-xl font-semibold max-w-xl mx-auto leading-snug mb-3"
              >
              Monitoreo inteligente de calidad del aire en espacios universitarios.
            </p>

            {/* Description */}
            <p
              style={{ animation: mounted ? 'heroFade 0.7s ease 0.42s both' : 'none' }}
              className="text-zinc-500 text-sm sm:text-base max-w-lg mx-auto leading-relaxed mb-10 sm:mb-12"
            >
              Plataforma de visualización en tiempo real para interpretar datos ambientales
              obtenidos desde sensores instalados en la universidad.
            </p>

            {/* CTAs */}
            <div
              style={{ animation: mounted ? 'heroFade 0.7s ease 0.54s both' : 'none' }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center"
            >
              <Link
                href="/sensores"
                className="glow-btn inline-flex items-center justify-center gap-2 px-7 sm:px-8 py-3.5 sm:py-4 w-full sm:w-auto sm:min-w-[190px] bg-emerald-500 text-zinc-950 font-bold rounded-xl text-sm sm:text-[15px] hero-title"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" strokeLinecap="round" />
                </svg>
                Ver monitoreo
              </Link>
              <a
                href="#proyecto"
                className="outline-btn inline-flex items-center justify-center px-7 sm:px-8 py-3.5 sm:py-4 w-full sm:w-auto sm:min-w-[190px] border border-zinc-700/80 text-zinc-300 font-semibold rounded-xl text-sm sm:text-[15px] hero-title"
              >
                Conocer el proyecto
              </a>
            </div>
          </div>
        </section>

        {/* ── ¿QUÉ ES SENSED? ─────────────────────────────────────────────── */}
        <section id="proyecto" className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center mb-10 sm:mb-12">
            <p className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase mb-2.5" style={{ color: '#6ee7b7' }}>
              ¿Qué es SENSED?
            </p>
            <h2 className="hero-title text-3xl sm:text-4xl md:text-[2.75rem] text-zinc-100 tracking-tight mb-3">
              Una plataforma pensada para la universidad
            </h2>
            <p className="text-zinc-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              SENSED conecta sensores físicos con una interfaz web para visualizar, en tiempo real,
              las condiciones ambientales de los espacios universitarios.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: (
                  <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center">
                    <svg width="16" height="16" fill="none" stroke="#34d399" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                ),
                title: 'Monitoreo en tiempo real',
                desc: 'Visualización continua de mediciones ambientales provenientes de sensores conectados.',
              },
              {
                icon: (
                  <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center">
                    <svg width="16" height="16" fill="none" stroke="#34d399" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" strokeLinecap="round" />
                    </svg>
                  </div>
                ),
                title: 'Interpretación simple',
                desc: 'Indicadores visuales y métricas comprensibles para cualquier usuario, incluso sin conocimientos técnicos.',
              },
              {
                icon: (
                  <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center">
                    <svg width="16" height="16" fill="none" stroke="#34d399" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                ),
                title: 'Escalable',
                desc: 'Arquitectura preparada para incorporar nuevos sensores, ubicaciones y futuras variables ambientales.',
              },
            ].map((item, i) => (
              <CapabilityCard key={i} index={i} title={item.title} desc={item.desc} icon={item.icon} />
            ))}
          </div>
        </section>

        {/* ── ¿QUÉ MEDIMOS? (stats strip) ─────────────────────────────────── */}
        <section className="border-y border-zinc-800/50 bg-zinc-900/20">
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <div className="text-center mb-7">
              <p className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase" style={{ color: '#6ee7b7' }}>
                ¿Qué medimos?
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
              {[
                { value: '1', unit: '', label: 'Sensor activo' },
                { value: 'CO₂', unit: '', label: 'Monitoreado' },
                { value: '417K', unit: '+', label: 'Registros históricos' },
                { value: '∞', unit: '', label: 'Escalable a campus' },
              ].map((s, i) => (
                <div key={i} className="stat-card text-center py-5 sm:py-6 px-3 sm:px-4 rounded-xl border border-zinc-800/40 bg-zinc-900/40 cursor-default">
                  <div className="hero-title text-3xl sm:text-4xl md:text-5xl text-emerald-400 mb-1.5 sm:mb-2">
                    {s.value}<span className="text-xl sm:text-2xl text-emerald-700">{s.unit}</span>
                  </div>
                  <div className="text-[10px] sm:text-xs text-zinc-600 font-medium tracking-widest uppercase">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ¿POR QUÉ IMPORTA EL CO₂? ───────────────────────────────────── */}
        <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center mb-10 sm:mb-12">
            <p className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase mb-2.5" style={{ color: '#6ee7b7' }}>
              Referencia
            </p>
            <h2 className="hero-title text-3xl sm:text-4xl md:text-[2.75rem] text-zinc-100 tracking-tight mb-4">
              ¿Por qué importa el CO₂?
            </h2>
            <p className="text-zinc-500 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              El dióxido de carbono (CO₂) es un indicador útil para evaluar la ventilación de ambientes cerrados.
              Niveles elevados pueden sugerir baja renovación de aire.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CO2LevelCard
              label="Bueno" range="0 – 800 ppm"
              desc="Ventilación adecuada. El ambiente es confortable y la calidad del aire es óptima."
              color="#34d399" delay={0}
            />
            <CO2LevelCard
              label="Atención" range="801 – 1200 ppm"
              desc="Ventilación moderada. Se recomienda abrir ventanas o aumentar la circulación de aire."
              color="#fbbf24" delay={80}
            />
            <CO2LevelCard
              label="Crítico" range="1200+ ppm"
              desc="Ventilación insuficiente. Se sugiere ventilar el espacio de forma inmediata."
              color="#ef4444" delay={160}
            />
          </div>

          {/* Visual scale bar */}
          <div className="mt-8 rounded-2xl border border-zinc-800/40 bg-zinc-900/40 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest" style={{ fontFamily: FONT_DISPLAY }}>Escala de referencia (ppm CO₂)</span>
              <span className="text-xs text-zinc-600">Valores orientativos</span>
            </div>
            <div className="relative h-3 rounded-full overflow-hidden" style={{
              background: 'linear-gradient(90deg, #34d399 0%, #34d399 40%, #fbbf24 40%, #fbbf24 65%, #ef4444 65%, #ef4444 100%)'
            }}>
              <div className="absolute inset-0 opacity-20" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.3), transparent)' }} />
            </div>
            <div className="flex justify-between mt-2 text-[11px] text-zinc-600" style={{ fontFamily: FONT_DISPLAY }}>
              <span>0</span>
              <span>800</span>
              <span>1200</span>
              <span>2000+</span>
            </div>
          </div>
        </section>

        {/* ── ¿CÓMO FUNCIONA? ─────────────────────────────────────────────── */}
        <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-t border-zinc-800/30">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">
            <div className="lg:sticky lg:top-24 lg:w-64 xl:w-72 flex-shrink-0">
              <p className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase mb-2.5" style={{ color: '#6ee7b7' }}>
                ¿Cómo funciona?
              </p>
              <h2 className="hero-title text-3xl sm:text-[2rem] text-zinc-100 tracking-tight mb-3">
                Del sensor a la pantalla
              </h2>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Cuatro etapas simples que convierten una medición física en información útil y accesible.
              </p>
            </div>

            <div className="flex-1 min-w-0">
              {[
                { num: '1', title: 'Sensor físico mide CO₂', text: 'Un microcontrolador con sensor de CO₂ captura las condiciones del ambiente en tiempo continuo.' },
                { num: '2', title: 'Datos enviados a Firebase', text: 'Cada medición se transmite por WiFi a Firebase Realtime Database, con timestamp y valor en ppm.' },
                { num: '3', title: 'Procesamiento en la plataforma', text: 'La plataforma web lee los datos en tiempo real, identifica el registro más reciente y calcula el estado.' },
                { num: '4', title: 'Visualización e interpretación', text: 'El usuario ve el valor actual, el historial en gráfico y el estado (Bueno / Atención / Crítico) de forma inmediata.' },
              ].map((step, i, arr) => (
                <WorkflowStep key={i} index={i} num={step.num} title={step.title} text={step.text} isLast={i === arr.length - 1} />
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ───────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-t border-zinc-800/50">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] sm:w-[700px] h-[260px] bg-emerald-900/15 blur-[80px] rounded-full" />
          </div>

          <div className="relative w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 md:py-28 text-center">
            <p className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase mb-3" style={{ color: '#6ee7b7' }}>
              Monitoreo activo
            </p>
            <h2 className="hero-title text-3xl sm:text-4xl md:text-5xl text-zinc-100 tracking-tight mb-4 sm:mb-5">
              Explorá el monitoreo<br className="hidden sm:block" /> en tiempo real
            </h2>
            <p className="text-zinc-500 mb-8 sm:mb-10 max-w-md mx-auto text-sm sm:text-[15px] leading-relaxed">
              Visualizá los datos del sensor activo, revisá el historial de lecturas y monitoreá el estado del ambiente desde cualquier dispositivo.
            </p>

            <Link
              href="/dashboard"
              className="glow-btn inline-flex items-center justify-center gap-2 px-8 sm:px-10 py-4 bg-emerald-500 text-zinc-950 font-bold rounded-xl text-sm sm:text-[15px] hero-title"
            >
              Ingresar al dashboard
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </section>

      </main>

      <FooterDisclaimer />
    </div>
  )
}
