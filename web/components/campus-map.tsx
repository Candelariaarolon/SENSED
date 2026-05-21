'use client'

import { useEffect, useRef, useState } from 'react'

// ─── Device config ────────────────────────────────────────────────────────────
// Positions within UCC campus — Av. Armada Argentina 3555, Córdoba
export const DEVICE_CONFIG = [
  { id: 'device1', name: 'Sensor CO₂ UCC',     short: 'device1', location: 'Prueba inicial',  lat: -31.3658, lng: -64.2178 },
  { id: 'device2', name: 'Sensor Aula 204',     short: 'device2', location: 'Aula 204',        lat: -31.3649, lng: -64.2168 },
  { id: 'device3', name: 'Sensor Biblioteca',   short: 'device3', location: 'Biblioteca',      lat: -31.3667, lng: -64.2186 },
  { id: 'device4', name: 'Sensor Laboratorio',  short: 'device4', location: 'Laboratorio',     lat: -31.3662, lng: -64.2163 },
]

const CAMPUS_CENTER = { lat: -31.3658, lng: -64.2178 }
const CAMPUS_ZOOM   = 17

const FONT_DISPLAY = "'Google Sans', system-ui, sans-serif"

// ─── Types ────────────────────────────────────────────────────────────────────
export interface DeviceMapData {
  id: string
  co2: number | null
  status: string | null
  color: string
  lastTime: string
}

function co2Color(ppm: number | null): string {
  if (ppm === null) return '#52525b'
  if (ppm < 800)   return '#34d399'
  if (ppm <= 1200) return '#fbbf24'
  return '#ef4444'
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export function CampusMap({ devices, selectedId, onSelect }: {
  devices: DeviceMapData[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<unknown>(null)
  const layersRef    = useRef<Record<string, unknown>>({})

  // ── Init map once ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let isMounted = true

    ;(async () => {
      const L = (await import('leaflet')).default
      if (!isMounted || !containerRef.current) return

      // Leaflet CSS
      if (!document.getElementById('leaflet-css')) {
        const link = Object.assign(document.createElement('link'), {
          id: 'leaflet-css', rel: 'stylesheet',
          href: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
        })
        document.head.appendChild(link)
      }

      // Fix broken icon paths
      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(containerRef.current, {
        center: [CAMPUS_CENTER.lat, CAMPUS_CENTER.lng],
        zoom: CAMPUS_ZOOM,
        zoomControl: true,
        scrollWheelZoom: true,
        attributionControl: true,
      })

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map)

      // Dark theme overrides
      const style = document.createElement('style')
      style.textContent = `
        .campus-popup .leaflet-popup-content-wrapper {
          background: #18181b !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 12px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
          padding: 0 !important;
        }
        .campus-popup .leaflet-popup-content { margin: 0 !important; }
        .campus-popup .leaflet-popup-tip { background: #18181b !important; }
        .campus-popup .leaflet-popup-close-button { color: #71717a !important; font-size:16px !important; top:6px !important; right:8px !important; }
        .leaflet-control-zoom a { background:rgba(24,24,27,0.94)!important; color:#a1a1aa!important; border-color:rgba(255,255,255,0.08)!important; backdrop-filter:blur(8px)!important; }
        .leaflet-control-zoom a:hover { color:#34d399!important; }
        .leaflet-control-zoom-in  { border-radius:10px 10px 0 0 !important; }
        .leaflet-control-zoom-out { border-radius:0 0 10px 10px !important; }
        .leaflet-control-attribution { background:rgba(24,24,27,0.8)!important; color:#52525b!important; font-size:10px!important; }
        .leaflet-control-attribution a { color:#71717a!important; }
      `
      document.head.appendChild(style)

      // Build layers for each device
      DEVICE_CONFIG.forEach((cfg) => {
        const devData = devices.find((d) => d.id === cfg.id)
        const color   = co2Color(devData?.co2 ?? null)
        const active  = devData?.co2 != null

        // Zone circle around device
        const circle = L.circle([cfg.lat, cfg.lng], {
          radius: 60,
          color,
          fillColor: color,
          fillOpacity: active ? 0.25 : 0.08,
          weight: active ? 2.5 : 1,
          opacity: active ? 0.8 : 0.3,
          dashArray: active ? undefined : '4 4',
        }).addTo(map)

        // Pulse marker icon
        const icon = L.divIcon({
          className: '',
          html: buildMarkerHTML(color, active),
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        })

        const marker = L.marker([cfg.lat, cfg.lng], { icon }).addTo(map)

        const popupHTML = buildPopupHTML(cfg, devData)
        marker.bindPopup(popupHTML, { className: 'campus-popup', maxWidth: 220 })
        circle.bindPopup(popupHTML, { className: 'campus-popup', maxWidth: 220 })

        layersRef.current[cfg.id] = { circle, marker, map }
      })

      mapRef.current = map

      // Fix rendering after mount
      setTimeout(() => map.invalidateSize(), 150)
    })()

    return () => {
      isMounted = false
      if (mapRef.current) {
        ;(mapRef.current as { remove: () => void }).remove()
        mapRef.current = null
        layersRef.current = {}
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Update layers when CO2 data changes ───────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return
    import('leaflet').then((Lmod) => {
      const L = Lmod.default
      devices.forEach((devData) => {
        const layers = layersRef.current[devData.id] as { circle: unknown; marker: unknown } | undefined
        if (!layers) return
        const color  = co2Color(devData.co2)
        const active = devData.co2 != null

        const circle = layers.circle as { setStyle: (s: object) => void; setPopupContent: (c: string) => void }
        circle.setStyle({
          color, fillColor: color,
          fillOpacity: active ? 0.25 : 0.08,
          weight: active ? 2.5 : 1,
          opacity: active ? 0.8 : 0.3,
        })

        const cfg = DEVICE_CONFIG.find((c) => c.id === devData.id)!
        const popup = buildPopupHTML(cfg, devData)
        circle.setPopupContent(popup)

        const marker = layers.marker as { setIcon: (i: unknown) => void; setPopupContent: (c: string) => void }
        marker.setIcon(L.divIcon({
          className: '',
          html: buildMarkerHTML(color, active),
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        }))
        marker.setPopupContent(popup)
      })
    })
  }, [devices])

  // ── Fly to selected device ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !selectedId) return
    const cfg = DEVICE_CONFIG.find((c) => c.id === selectedId)
    if (!cfg) return
    const map = mapRef.current as { flyTo: (latlng: [number, number], zoom: number, opts: object) => void; openPopup?: () => void }
    map.flyTo([cfg.lat, cfg.lng], 18, { animate: true, duration: 0.8 })
  }, [selectedId])

  return (
    <div ref={containerRef} className="w-full h-full" />
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildMarkerHTML(color: string, active: boolean): string {
  return `
    <div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
      ${active ? `<div style="position:absolute;width:28px;height:28px;border-radius:50%;background:${color};opacity:0.2;animation:cpulse 2s ease-in-out infinite;"></div>` : ''}
      <div style="position:absolute;width:12px;height:12px;border-radius:50%;background:${color};border:2px solid rgba(0,0,0,0.5);box-shadow:0 0 6px ${color}60;"></div>
    </div>
    <style>@keyframes cpulse{0%,100%{transform:scale(1);opacity:.2}50%{transform:scale(1.9);opacity:0}}</style>
  `
}

function buildPopupHTML(
  cfg: typeof DEVICE_CONFIG[0],
  data: DeviceMapData | undefined
): string {
  const color  = co2Color(data?.co2 ?? null)
  const active = data?.co2 != null
  return `
    <div style="font-family:${FONT_DISPLAY};padding:14px 16px;min-width:160px;">
      <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#71717a;margin:0 0 5px;">${cfg.id}</p>
      <p style="font-size:14px;font-weight:700;color:#f4f4f5;margin:0 0 3px;">${cfg.name}</p>
      <p style="font-size:12px;color:#71717a;margin:0 0 10px;">${cfg.location}</p>
      ${active && data ? `
        <p style="font-size:32px;font-weight:800;color:${color};margin:0;line-height:1;">${data.co2}</p>
        <p style="font-size:11px;color:#71717a;margin:2px 0 8px;">ppm CO₂</p>
        <span style="display:inline-block;padding:3px 10px;border-radius:8px;font-size:11px;font-weight:700;color:${color};background:${color}22;border:1px solid ${color}44;">${data.status}</span>
        <p style="font-size:10px;color:#52525b;margin:8px 0 0;">${data.lastTime}</p>
      ` : `
        <p style="font-size:12px;color:#52525b;margin:4px 0 0;">Sin conexión</p>
      `}
    </div>
  `
}
