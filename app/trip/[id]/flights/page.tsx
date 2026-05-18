'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import FlightCard from '@/components/FlightCard'
import type { Trip } from '@/types'
import { DESTINATION_IATA } from '@/lib/utils'

interface Props {
  params: { id: string }
}

const AIRLINES = [
  { code: 'BR', name: '長榮航空', nameEn: 'EVA Air', emoji: '🟢', color: '#009900' },
  { code: 'CI', name: '中華航空', nameEn: 'China Airlines', emoji: '🔴', color: '#CC0000' },
  { code: 'JX', name: '星宇航空', nameEn: 'STARLUX', emoji: '⭐', color: '#1B4D8E' },
  { code: 'JL', name: '日本航空', nameEn: 'Japan Airlines', emoji: '🔴', color: '#C41E3A' },
  { code: 'NH', name: '全日空', nameEn: 'ANA', emoji: '🔵', color: '#1C4F8E' },
  { code: 'IT', name: '台灣虎航', nameEn: 'Tigerair Taiwan', emoji: '🟡', color: '#FF6600' },
]

export default function FlightsPage({ params }: Props) {
  const { id: tripId } = params
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTrip()
  }, [tripId])

  async function loadTrip() {
    const { data } = await supabase.from('trips').select('*').eq('id', tripId).single()
    if (data) setTrip(data as Trip)
    setLoading(false)
  }

  function buildGoogleFlightsUrl(_airlineCode: string): string {
    if (!trip) return 'https://www.google.com/travel/flights'
    const iata = DESTINATION_IATA[trip.destination]
    const dest = iata ?? encodeURIComponent(trip.destination)
    const date = trip.depart_date
    return `https://www.google.com/travel/flights?q=Flights+from+TPE+to+${dest}+on+${date}`
  }

  function buildSkyscannerUrl(): string {
    if (!trip) return 'https://www.skyscanner.com.tw'
    const iata = DESTINATION_IATA[trip.destination]
    if (iata) {
      const date = trip.depart_date.replace(/-/g, '')
      return `https://www.skyscanner.com.tw/transport/flights/tpe/${iata.toLowerCase()}/${date}/`
    }
    return `https://www.skyscanner.com.tw/transport/flights/tpe/?query=${encodeURIComponent(trip.destination)}`
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl mb-3 animate-bounce">✈️</div>
          <p className="text-[#888888] text-sm">載入航班資訊...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[480px] mx-auto px-4 py-6">
        {/* Trip info banner */}
        {trip && (
          <div className="bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✈️</span>
              <div>
                <p className="text-white font-medium text-sm">
                  TPE → {trip.destination}
                </p>
                <p className="text-[#888888] text-xs mt-0.5">
                  出發日期：{trip.depart_date} · {trip.passengers}位旅客
                </p>
              </div>
            </div>
          </div>
        )}

        <h2 className="text-[#888888] text-xs font-medium uppercase tracking-wider mb-3">
          選擇航空公司
        </h2>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {AIRLINES.map((airline) => (
            <FlightCard
              key={airline.code}
              airline={airline}
              url={buildGoogleFlightsUrl(airline.code)}
            />
          ))}
        </div>

        {/* Skyscanner banner */}
        <a
          href={buildSkyscannerUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-[#0070E0] hover:bg-[#0060C0] rounded-xl p-4 text-white transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔍</span>
            <div>
              <p className="font-semibold text-sm">Skyscanner 比價</p>
              <p className="text-white/70 text-xs mt-0.5">比較所有航空公司最低票價</p>
            </div>
            <svg className="w-5 h-5 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
        </a>

        {/* Tips */}
        <div className="mt-6 bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
          <h3 className="text-white text-sm font-medium mb-3">購票小提醒</h3>
          <ul className="space-y-2 text-[#888888] text-xs">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 flex-shrink-0">💡</span>
              <span>建議提前 2-3 個月購買機票，通常可享有較低票價</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 flex-shrink-0">🎒</span>
              <span>低成本航空通常行李需另外加購，購票前請確認行李規定</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 flex-shrink-0">🔄</span>
              <span>可考慮去回程不同航空公司，善用不同出發/返回機場</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
