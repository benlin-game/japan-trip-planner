'use client'

import { useState } from 'react'
import type { LocalTripEntry } from '@/types'

interface Props {
  onClose: () => void
  onCreated: (tripId: string) => void
}

export default function CreateTripModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [destination, setDestination] = useState('')
  const [days, setDays] = useState(5)
  const [departDate, setDepartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().split('T')[0]
  })
  const [passengers, setPassengers] = useState(2)
  const [yourName, setYourName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !yourName.trim() || !destination.trim()) {
      setError('請填寫旅程名稱、目的地和你的暱稱')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          destination,
          days,
          depart_date: departDate,
          passengers,
          created_by: yourName.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '建立失敗，請稍後再試')
        return
      }

      // Save to localStorage
      const entry: LocalTripEntry = {
        tripId: data.id,
        userName: yourName.trim(),
        tripName: name.trim(),
        destination: destination.trim(),
        joinedAt: new Date().toISOString(),
      }
      try {
        const stored = localStorage.getItem('japan-trips')
        const trips: LocalTripEntry[] = stored ? JSON.parse(stored) : []
        trips.push(entry)
        localStorage.setItem('japan-trips', JSON.stringify(trips))
      } catch { /* ignore */ }

      onCreated(data.id)
    } catch {
      setError('網路錯誤，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-[480px] bg-[#111111] rounded-t-3xl border-t border-[rgba(255,255,255,0.08)] animate-slide-up">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[rgba(255,255,255,0.08)]">
          <h2 className="text-white text-lg font-semibold">建立新旅程</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#222222] flex items-center justify-center text-[#888888] hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 overflow-y-auto max-h-[70vh] pb-8">
          {/* Your name */}
          <div>
            <label className="block text-[#888888] text-xs mb-1.5">你的暱稱</label>
            <input
              type="text"
              value={yourName}
              onChange={(e) => setYourName(e.target.value)}
              placeholder="例：小明"
              maxLength={20}
              className="w-full bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444444] focus:outline-none focus:border-[rgba(255,255,255,0.2)]"
            />
          </div>

          {/* Trip name */}
          <div>
            <label className="block text-[#888888] text-xs mb-1.5">旅程名稱</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：2025年暑假東京之旅"
              maxLength={50}
              className="w-full bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444444] focus:outline-none focus:border-[rgba(255,255,255,0.2)]"
            />
          </div>

          {/* Destination */}
          <div>
            <label className="block text-[#888888] text-xs mb-1.5">目的地</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="例：東京、巴黎、首爾、峇里島"
              maxLength={30}
              className="w-full bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444444] focus:outline-none focus:border-[rgba(255,255,255,0.2)]"
            />
          </div>

          {/* Days */}
          <div>
            <label className="block text-[#888888] text-xs mb-1.5">天數：{days}天</label>
            <input
              type="range"
              min={1}
              max={14}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full accent-[#FF6B35]"
            />
            <div className="flex justify-between text-[#555555] text-xs mt-1">
              <span>1天</span>
              <span>14天</span>
            </div>
          </div>

          {/* Depart date */}
          <div>
            <label className="block text-[#888888] text-xs mb-1.5">出發日期</label>
            <input
              type="date"
              value={departDate}
              onChange={(e) => setDepartDate(e.target.value)}
              className="w-full bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[rgba(255,255,255,0.2)] [color-scheme:dark]"
            />
          </div>

          {/* Passengers */}
          <div>
            <label className="block text-[#888888] text-xs mb-1.5">人數：{passengers}人</label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setPassengers(Math.max(1, passengers - 1))}
                className="w-10 h-10 rounded-full bg-[#222222] text-white font-bold text-lg flex items-center justify-center hover:bg-[#333333] transition-colors"
              >
                −
              </button>
              <span className="text-white text-xl font-bold w-8 text-center">{passengers}</span>
              <button
                type="button"
                onClick={() => setPassengers(Math.min(20, passengers + 1))}
                className="w-10 h-10 rounded-full bg-[#222222] text-white font-bold text-lg flex items-center justify-center hover:bg-[#333333] transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl text-white font-semibold text-base transition-opacity disabled:opacity-50 hover:opacity-90"
            style={{ backgroundColor: '#FF6B35' }}
          >
            {loading ? '建立中...' : '建立旅程 ✈️'}
          </button>
        </form>
      </div>
    </div>
  )
}
