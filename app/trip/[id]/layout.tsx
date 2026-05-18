'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import OnlineUsers from '@/components/OnlineUsers'
import type { Trip } from '@/types'
import { getDestinationColor } from '@/lib/utils'

interface Props {
  children: React.ReactNode
  params: { id: string }
}

const TABS = [
  { key: 'itinerary', label: '行程', icon: '🗓️' },
  { key: 'map', label: '地圖', icon: '🗺️' },
  { key: 'flights', label: '航班', icon: '✈️' },
  { key: 'budget', label: '預算', icon: '💰' },
  { key: 'chat', label: 'AI助理', icon: '🤖' },
]

export default function TripLayout({ children, params }: Props) {
  const { id } = params
  const pathname = usePathname()
  const router = useRouter()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState<string>('')

  const activeTab =
    TABS.find((t) => pathname.includes(`/${t.key}`))?.key ?? 'itinerary'

  const accentColor = trip ? getDestinationColor(trip.destination) : '#FF6B35'

  const [copied, setCopied] = useState(false)
  const copyInviteCode = useCallback(() => {
    if (!trip) return
    navigator.clipboard.writeText(trip.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [trip])

  const [deleting, setDeleting] = useState(false)
  async function handleDeleteTrip() {
    if (!trip) return
    if (!window.confirm(`確定要刪除「${trip.name}」？此操作無法復原。`)) return
    setDeleting(true)
    await supabase.from('trips').delete().eq('id', id)
    try {
      const stored = localStorage.getItem('japan-trips')
      if (stored) {
        const trips = JSON.parse(stored)
        localStorage.setItem('japan-trips', JSON.stringify(
          trips.filter((t: { tripId: string }) => t.tripId !== id)
        ))
      }
    } catch { /* ignore */ }
    router.push('/')
  }

  useEffect(() => {
    loadTrip()
    // Get userName from localStorage
    try {
      const stored = localStorage.getItem('japan-trips')
      if (stored) {
        const trips = JSON.parse(stored)
        const entry = trips.find((t: { tripId: string }) => t.tripId === id)
        if (entry) {
          setUserName(entry.userName)
        }
      }
    } catch {
      // ignore
    }
  }, [id])

  async function loadTrip() {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      router.push('/')
      return
    }
    setTrip(data as Trip)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl mb-3 animate-bounce">✈️</div>
          <p className="text-[#888888] text-sm">載入旅程中...</p>
        </div>
      </div>
    )
  }

  if (!trip) return null

  return (
    <div
      className="h-screen bg-[#080808] flex flex-col"
      style={{ '--accent': accentColor } as React.CSSProperties}
    >
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-[#080808] border-b border-[rgba(255,255,255,0.08)]">
        <div className="max-w-[480px] mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-[#888888] hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-white font-semibold text-sm truncate">
                {trip.name}
              </h1>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                style={{
                  backgroundColor: `${accentColor}20`,
                  color: accentColor,
                }}
              >
                {trip.destination}
              </span>
            </div>
            <p className="text-[#888888] text-xs mt-0.5">
              {trip.days}天 · {trip.passengers}人
            </p>
          </div>
          <button
            onClick={copyInviteCode}
            className="flex items-center gap-1 px-2 py-1 rounded-md border border-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.25)] transition-colors flex-shrink-0"
            title="複製邀請碼"
          >
            <span className="text-[#888888] text-[10px] font-mono tracking-widest">
              {trip.invite_code}
            </span>
            <span className="text-[10px]">{copied ? '✓' : '📋'}</span>
          </button>
          {userName === trip.created_by && (
            <button
              onClick={handleDeleteTrip}
              disabled={deleting}
              className="p-1.5 rounded-md text-[#666666] hover:text-red-400 hover:bg-[rgba(239,68,68,0.1)] transition-colors flex-shrink-0"
              title="刪除旅程"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          <OnlineUsers tripId={id} userName={userName} accentColor={accentColor} />
        </div>
      </header>

      {/* Page content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>

      {/* Bottom tab bar */}
      <nav className="sticky bottom-0 z-40 bg-[#0D0D0D] border-t border-[rgba(255,255,255,0.08)]">
        <div className="max-w-[480px] mx-auto flex">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <Link
                key={tab.key}
                href={`/trip/${id}/${tab.key}`}
                className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                  isActive ? 'text-white' : 'text-[#666666] hover:text-[#999999]'
                }`}
              >
                <span className={`text-lg leading-none ${isActive ? 'scale-110' : ''} transition-transform`}>
                  {tab.icon}
                </span>
                <span
                  className="text-[10px] font-medium"
                  style={isActive ? { color: accentColor } : undefined}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <span
                    className="w-4 h-0.5 rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
