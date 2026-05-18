'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface Props {
  tripId: string
  userName: string
  accentColor: string
}

interface PresenceEntry {
  name: string
  online_at: string
}

export default function OnlineUsers({ tripId, userName, accentColor }: Props) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const mountId = useRef(Math.random().toString(36).slice(2, 8))

  useEffect(() => {
    if (!userName) return

    const channel = supabase.channel(`presence-${tripId}-${mountId.current}`, {
      config: { presence: { key: userName } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceEntry>()
        setOnlineUsers(Object.keys(state))
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUsers((prev) => [...new Set([...prev, key])])
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers((prev) => prev.filter((u) => u !== key))
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            name: userName,
            online_at: new Date().toISOString(),
          })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tripId, userName])

  if (onlineUsers.length === 0) return null

  const displayUsers = onlineUsers.slice(0, 4)
  const overflow = onlineUsers.length - 4

  const AVATAR_COLORS = [
    '#FF6B35', '#FFB800', '#9B59B6', '#00CED1',
    '#3498DB', '#2ECC71', '#E74C3C', '#F39C12',
  ]

  return (
    <div className="flex items-center gap-1">
      <div className="flex -space-x-1.5">
        {displayUsers.map((user, idx) => {
          const color = AVATAR_COLORS[idx % AVATAR_COLORS.length]
          const isCurrentUser = user === userName
          return (
            <div
              key={user}
              className="relative w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-[#080808] flex-shrink-0"
              style={{ backgroundColor: color }}
              title={user + (isCurrentUser ? ' (你)' : '')}
            >
              {user.charAt(0).toUpperCase()}
              {/* Online dot */}
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-[#080808]" />
            </div>
          )
        })}
        {overflow > 0 && (
          <div className="w-6 h-6 rounded-full bg-[#333333] flex items-center justify-center text-[#888888] text-[9px] font-bold border-2 border-[#080808]">
            +{overflow}
          </div>
        )}
      </div>
      <span className="text-[#888888] text-[10px] ml-1">
        {onlineUsers.length}人在線
      </span>
    </div>
  )
}
