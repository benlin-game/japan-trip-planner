'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ItineraryItem, Trip } from '@/types'
import { getSpotById, getSpotByName } from '@/lib/spots'

interface Props {
  params: { id: string }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type G = any

declare global {
  interface Window {
    google: G
    initMap: () => void
  }
}

const DEFAULT_CENTERS: Record<string, { lat: number; lng: number }> = {
  '東京': { lat: 35.6762, lng: 139.6503 },
  '大阪': { lat: 34.6937, lng: 135.5023 },
  '京都': { lat: 35.0116, lng: 135.7681 },
  '福岡': { lat: 33.5904, lng: 130.4017 },
  '沖繩': { lat: 26.2124, lng: 127.6792 },
  '札幌': { lat: 43.0618, lng: 141.3545 },
}

const SCRIPT_ID = 'google-maps-script'

export default function MapPage({ params }: Props) {
  const { id: tripId } = params
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<G>(null)
  const markersRef = useRef<G[]>([])
  const [trip, setTrip] = useState<Trip | null>(null)
  const [items, setItems] = useState<ItineraryItem[]>([])
  const [activeDay, setActiveDay] = useState(1)
  const [mapsLoaded, setMapsLoaded] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [tripId])

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) return

    if (window.google?.maps) {
      setMapsLoaded(true)
      return
    }

    if (document.getElementById(SCRIPT_ID)) {
      const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement
      existing.addEventListener('load', () => setMapsLoaded(true), { once: true })
      return
    }

    window.initMap = () => setMapsLoaded(true)

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (mapsLoaded && trip && mapRef.current) {
      initMap()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsLoaded, trip])

  useEffect(() => {
    if (mapInstanceRef.current) {
      updateMarkers()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDay, items])

  async function loadData() {
    const [tripRes, itemsRes] = await Promise.all([
      supabase.from('trips').select('*').eq('id', tripId).single(),
      supabase.from('itinerary_items').select('*').eq('trip_id', tripId).order('day').order('order_index'),
    ])
    if (tripRes.data) setTrip(tripRes.data as Trip)
    if (itemsRes.data) setItems(itemsRes.data as ItineraryItem[])
    setLoading(false)
  }

  function initMap() {
    if (!mapRef.current || !window.google?.maps) return

    const center = trip
      ? (DEFAULT_CENTERS[trip.destination] ?? { lat: 35.6762, lng: 139.6503 })
      : { lat: 35.6762, lng: 139.6503 }

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 13,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      ],
    })

    updateMarkers()
  }

  function updateMarkers() {
    if (!mapInstanceRef.current || !window.google?.maps) return

    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []

    const dayItems = items
      .filter((item) => item.day === activeDay && item.spot_type !== '交通')
      .sort((a, b) => a.order_index - b.order_index)

    const bounds = new window.google.maps.LatLngBounds()
    let markerIdx = 0

    for (const item of dayItems) {
      const predefined = getSpotById(item.spot_id) ?? getSpotByName(item.spot_name)
      const lat = item.lat || predefined?.lat || 0
      const lng = item.lng || predefined?.lng || 0
      if (!lat || !lng) continue

      markerIdx++
      const pos = { lat, lng }
      bounds.extend(pos)

      const marker = new window.google.maps.Marker({
        position: pos,
        map: mapInstanceRef.current,
        title: item.spot_name,
        label: {
          text: String(markerIdx),
          color: 'white',
          fontWeight: 'bold',
          fontSize: '12px',
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 16,
          fillColor: '#FF6B35',
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2,
        },
      })

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="background:#1a1a1a;color:#f5f5f5;padding:12px;border-radius:8px;max-width:200px;font-family:sans-serif;">
            <div style="font-size:18px;margin-bottom:4px">${item.spot_emoji}</div>
            <div style="font-weight:600;font-size:14px;margin-bottom:4px">${item.spot_name}</div>
            <div style="color:#888;font-size:12px">${item.spot_type} · ${item.duration}分鐘</div>
            ${predefined?.openTime ? `<div style="color:#888;font-size:11px;margin-top:4px">🕐 ${predefined.openTime}</div>` : ''}
          </div>
        `,
      })

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker)
      })

      markersRef.current.push(marker)
    }

    if (markersRef.current.length > 1) {
      mapInstanceRef.current.fitBounds(bounds)
      window.google.maps.event.addListenerOnce(mapInstanceRef.current, 'idle', () => {
        if (mapInstanceRef.current.getZoom() > 16) mapInstanceRef.current.setZoom(16)
      })
    } else if (markersRef.current.length === 1) {
      mapInstanceRef.current.setCenter(markersRef.current[0].getPosition())
      mapInstanceRef.current.setZoom(15)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#080808]">
        <div className="text-center">
          <div className="text-3xl mb-3">🗺️</div>
          <p className="text-[#888888] text-sm">載入地圖中...</p>
        </div>
      </div>
    )
  }

  const days = trip ? Array.from({ length: trip.days }, (_, i) => i + 1) : []
  const mapDayItems = items
    .filter((i) => i.day === activeDay && i.spot_type !== '交通')
    .sort((a, b) => a.order_index - b.order_index)

  return (
    <div className="h-full flex flex-col">
      <div className="bg-[#080808] border-b border-[rgba(255,255,255,0.08)] z-10">
        <div className="max-w-[480px] mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-3">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  day === activeDay ? 'text-white' : 'text-[#888888] bg-[#161616] hover:text-white'
                }`}
                style={day === activeDay ? { backgroundColor: 'var(--accent)' } : undefined}
              >
                Day {day}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />
      </div>

      {mapDayItems.length > 0 && (
        <div className="bg-[#0D0D0D] border-t border-[rgba(255,255,255,0.08)]">
          <div className="max-w-[480px] mx-auto px-4 py-3">
            <div className="flex gap-2 overflow-x-auto">
              {mapDayItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex-shrink-0 flex items-center gap-2 bg-[#161616] rounded-lg px-3 py-2"
                >
                  <span
                    className="w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'var(--accent)' }}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-white text-sm whitespace-nowrap">{item.spot_emoji} {item.spot_name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
