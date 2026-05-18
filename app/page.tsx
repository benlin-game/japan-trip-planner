'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CreateTripModal from '@/components/CreateTripModal'
import JoinTripModal from '@/components/JoinTripModal'
import type { LocalTripEntry } from '@/types'
import { getDestinationColor, formatDate } from '@/lib/utils'

export default function HomePage() {
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [recentTrips, setRecentTrips] = useState<LocalTripEntry[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('japan-trips')
      if (stored) {
        const trips: LocalTripEntry[] = JSON.parse(stored)
        setRecentTrips(trips.slice().reverse())
      }
    } catch {
      // ignore parse errors
    }
  }, [])

  function handleTripCreated(tripId: string) {
    setShowCreate(false)
    router.push(`/trip/${tripId}/itinerary`)
  }

  function handleTripJoined(tripId: string) {
    setShowJoin(false)
    router.push(`/trip/${tripId}/itinerary`)
  }

  return (
    <main className="min-h-screen bg-[#080808] flex flex-col items-center justify-start px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="text-5xl mb-4">✈️</div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Trip Planner
        </h1>
        <p className="text-[#888888] text-base">
          多人協作 · 即時同步 · AI 旅遊助理
        </p>
      </div>

      {/* Main action cards */}
      <div className="w-full max-w-[480px] grid grid-cols-2 gap-4 mb-10 animate-slide-up">
        {/* Create trip */}
        <button
          onClick={() => setShowCreate(true)}
          className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 flex flex-col items-center gap-3 card-hover group transition-all duration-200 hover:border-[rgba(255,107,53,0.4)]"
        >
          <div className="w-14 h-14 rounded-full bg-[rgba(255,107,53,0.12)] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
            ✈️
          </div>
          <div className="text-center">
            <div className="text-white font-semibold text-base">建立旅程</div>
            <div className="text-[#888888] text-xs mt-1">建立一趟旅程</div>
          </div>
        </button>

        {/* Join trip */}
        <button
          onClick={() => setShowJoin(true)}
          className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 flex flex-col items-center gap-3 card-hover group transition-all duration-200 hover:border-[rgba(0,206,209,0.4)]"
        >
          <div className="w-14 h-14 rounded-full bg-[rgba(0,206,209,0.12)] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
            🔗
          </div>
          <div className="text-center">
            <div className="text-white font-semibold text-base">加入旅程</div>
            <div className="text-[#888888] text-xs mt-1">輸入邀請碼加入</div>
          </div>
        </button>
      </div>

      {/* Recent trips */}
      {recentTrips.length > 0 && (
        <div className="w-full max-w-[480px] animate-fade-in">
          <h2 className="text-[#888888] text-sm font-medium mb-3 px-1">
            最近的旅程
          </h2>
          <div className="space-y-2">
            {recentTrips.map((trip) => {
              const accentColor = getDestinationColor(trip.destination)
              return (
                <button
                  key={trip.tripId}
                  onClick={() =>
                    router.push(`/trip/${trip.tripId}/itinerary`)
                  }
                  className="w-full bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-xl p-4 flex items-center gap-4 card-hover text-left transition-all duration-200"
                  style={{
                    borderLeftColor: accentColor,
                    borderLeftWidth: 3,
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm truncate">
                      {trip.tripName}
                    </div>
                    <div className="text-[#888888] text-xs mt-0.5">
                      {trip.destination} · {trip.userName}
                    </div>
                  </div>
                  <svg
                    className="w-4 h-4 text-[#888888] flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Feature highlights */}
      <div className="w-full max-w-[480px] mt-12 grid grid-cols-3 gap-3">
        {[
          { icon: '🗓️', label: '行程規劃', desc: '拖拉排序' },
          { icon: '💰', label: '預算追蹤', desc: '即時統計' },
          { icon: '🤖', label: 'AI 助理', desc: 'Gemini 驅動' },
        ].map((f) => (
          <div
            key={f.label}
            className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-xl p-3 text-center"
          >
            <div className="text-xl mb-1">{f.icon}</div>
            <div className="text-white text-xs font-medium">{f.label}</div>
            <div className="text-[#888888] text-[10px] mt-0.5">{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <p className="mt-16 text-[#444444] text-xs text-center">
        Trip Planner · 多人協作旅遊規劃
      </p>

      {/* Modals */}
      {showCreate && (
        <CreateTripModal
          onClose={() => setShowCreate(false)}
          onCreated={handleTripCreated}
        />
      )}
      {showJoin && (
        <JoinTripModal
          onClose={() => setShowJoin(false)}
          onJoined={handleTripJoined}
        />
      )}
    </main>
  )
}
