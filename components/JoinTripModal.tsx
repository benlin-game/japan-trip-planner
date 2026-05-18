'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { LocalTripEntry, Destination } from '@/types'

interface Props {
  onClose: () => void
  onJoined: (tripId: string) => void
}

export default function JoinTripModal({ onClose, onJoined }: Props) {
  const [inviteCode, setInviteCode] = useState('')
  const [nickName, setNickName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = inviteCode.trim().toUpperCase()
    if (code.length !== 6) {
      setError('邀請碼必須是6個字元')
      return
    }
    if (!nickName.trim()) {
      setError('請輸入你的暱稱')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Find trip by invite code
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('invite_code', code)
        .single()

      if (tripError || !trip) {
        setError('找不到此邀請碼對應的旅程，請確認碼是否正確')
        return
      }

      // Insert member
      const { error: memberError } = await supabase.from('trip_members').insert({
        trip_id: trip.id,
        user_name: nickName.trim(),
      })

      if (memberError) {
        console.error('Member insert error:', memberError)
        // Non-fatal: still let them in
      }

      // Save to localStorage
      const entry: LocalTripEntry = {
        tripId: trip.id,
        userName: nickName.trim(),
        tripName: trip.name,
        destination: trip.destination as Destination,
        joinedAt: new Date().toISOString(),
      }
      try {
        const stored = localStorage.getItem('japan-trips')
        const trips: LocalTripEntry[] = stored ? JSON.parse(stored) : []
        // Avoid duplicates
        const filtered = trips.filter((t) => t.tripId !== trip.id)
        filtered.push(entry)
        localStorage.setItem('japan-trips', JSON.stringify(filtered))
      } catch { /* ignore */ }

      onJoined(trip.id)
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
          <h2 className="text-white text-lg font-semibold">加入旅程</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#222222] flex items-center justify-center text-[#888888] hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4 pb-10">
          {/* Invite code */}
          <div>
            <label className="block text-[#888888] text-xs mb-1.5">邀請碼（6碼）</label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="例：AB1C2D"
              maxLength={6}
              className="w-full bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-white text-xl font-mono tracking-[0.5em] text-center placeholder-[#444444] focus:outline-none focus:border-[rgba(255,255,255,0.2)] uppercase"
            />
            <p className="text-[#555555] text-xs mt-1.5 text-center">
              向旅程建立者取得6碼邀請碼
            </p>
          </div>

          {/* Nick name */}
          <div>
            <label className="block text-[#888888] text-xs mb-1.5">你的暱稱</label>
            <input
              type="text"
              value={nickName}
              onChange={(e) => setNickName(e.target.value)}
              placeholder="例：小花"
              maxLength={20}
              className="w-full bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444444] focus:outline-none focus:border-[rgba(255,255,255,0.2)]"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || inviteCode.length !== 6 || !nickName.trim()}
            className="w-full py-4 rounded-xl text-white font-semibold text-base bg-[#00CED1] transition-opacity disabled:opacity-40 hover:opacity-90"
          >
            {loading ? '加入中...' : '加入旅程 🔗'}
          </button>
        </form>
      </div>
    </div>
  )
}
