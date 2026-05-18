'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getSpotsByDestination, getSpotTypes } from '@/lib/spots'
import type { ItineraryItem, Spot } from '@/types'

interface Props {
  tripId: string
  destination: string
  day: number
  userName: string
  existingItems: ItineraryItem[]
  onClose: () => void
  onAdded: () => void
}

export default function SpotPicker({
  tripId,
  destination,
  day,
  userName,
  existingItems,
  onClose,
  onAdded,
}: Props) {
  const [activeType, setActiveType] = useState<string>('全部')
  const [adding, setAdding] = useState<string | null>(null)
  const [showCustom, setShowCustom] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customEmoji, setCustomEmoji] = useState('📍')
  const [customDuration, setCustomDuration] = useState(60)
  const [customType, setCustomType] = useState('其他')
  const [addingCustom, setAddingCustom] = useState(false)

  const EMOJI_PRESETS = [
    { label: '餐飲', emojis: ['🍜', '🍣', '🍱', '🍕', '🍔', '🥘', '🍺', '☕', '🧋', '🍦'] },
    { label: '住宿', emojis: ['🏨', '🏠', '🏡', '🛏️', '🏩'] },
    { label: '交通', emojis: ['🚗', '🚌', '🚃', '🚢', '🛺', '🚁', '🚞'] },
    { label: '景點', emojis: ['⛩️', '🗼', '🏯', '🎡', '🏖️', '🎭', '🏛️', '🗿'] },
    { label: '購物', emojis: ['🛍️', '🏪', '💎', '👗'] },
    { label: '其他', emojis: ['📍', '🎯', '⭐', '🎪', '📸', '🎵'] },
  ]

  const spots = getSpotsByDestination(destination)
  const types = ['全部', ...getSpotTypes(destination)]
  const existingIds = new Set(existingItems.map((i) => i.spot_id))

  const filtered =
    activeType === '全部' ? spots : spots.filter((s) => s.type === activeType)

  async function handleAddSpot(spot: Spot) {
    setAdding(spot.id)
    const maxOrder = existingItems.length
    try {
      await supabase.from('itinerary_items').insert({
        trip_id: tripId,
        day,
        spot_id: spot.id,
        spot_name: spot.name,
        spot_emoji: spot.emoji,
        spot_type: spot.type,
        duration: spot.duration,
        order_index: maxOrder,
        added_by: userName || '旅伴',
        lat: spot.lat,
        lng: spot.lng,
      })
      onAdded()
    } catch (err) {
      console.error('Add spot error:', err)
    } finally {
      setAdding(null)
    }
  }

  async function handleAddCustom() {
    if (!customName.trim()) return
    setAddingCustom(true)
    const maxOrder = existingItems.length
    try {
      await supabase.from('itinerary_items').insert({
        trip_id: tripId,
        day,
        spot_id: `custom-${Date.now()}`,
        spot_name: customName.trim(),
        spot_emoji: customEmoji,
        spot_type: customType,
        duration: customDuration,
        order_index: maxOrder,
        added_by: userName || '旅伴',
      })
      onAdded()
    } catch (err) {
      console.error('Add custom spot error:', err)
    } finally {
      setAddingCustom(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-[480px] bg-[#111111] rounded-t-3xl border-t border-[rgba(255,255,255,0.08)] animate-slide-up max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[rgba(255,255,255,0.08)] flex-shrink-0">
          <h2 className="text-white text-lg font-semibold">選擇景點 · Day {day}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#222222] flex items-center justify-center text-[#888888] hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Type filter */}
        <div className="flex gap-2 overflow-x-auto px-4 py-3 flex-shrink-0">
          {types.map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeType === type
                  ? 'text-white'
                  : 'bg-[#1A1A1A] text-[#888888] hover:text-white'
              }`}
              style={activeType === type ? { backgroundColor: 'var(--accent)' } : undefined}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Spot list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-2">
            {filtered.map((spot) => {
              const isAdded = existingIds.has(spot.id)
              const isAdding = adding === spot.id
              return (
                <div
                  key={spot.id}
                  className="bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-xl p-3 flex items-center gap-3"
                >
                  <span className="text-2xl flex-shrink-0">{spot.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm font-medium">{spot.name}</p>
                      <span className="text-[10px] text-[#888888] bg-[#222222] px-1.5 py-0.5 rounded-full">
                        {spot.type}
                      </span>
                    </div>
                    <p className="text-[#888888] text-[10px] mt-0.5">
                      {spot.openTime} · {spot.duration}分鐘
                    </p>
                    <p className="text-[#666666] text-[10px] mt-0.5 line-clamp-1">{spot.tip}</p>
                  </div>
                  <button
                    onClick={() => !isAdded && handleAddSpot(spot)}
                    disabled={isAdded || isAdding}
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                      isAdded
                        ? 'bg-[#222222] text-[#555555] cursor-default'
                        : 'text-white hover:opacity-80'
                    }`}
                    style={!isAdded ? { backgroundColor: 'var(--accent)' } : undefined}
                  >
                    {isAdding ? '...' : isAdded ? '✓' : '+'}
                  </button>
                </div>
              )
            })}

            {/* Custom spot option */}
            {!showCustom ? (
              <button
                onClick={() => setShowCustom(true)}
                className="w-full py-3 rounded-xl border-2 border-dashed border-[rgba(255,255,255,0.12)] text-[#888888] text-sm hover:border-[rgba(255,255,255,0.25)] hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <span>+</span>
                <span>自訂景點</span>
              </button>
            ) : (
              <div className="bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-xl p-4 space-y-3">
                <p className="text-white text-sm font-medium">自訂景點</p>
                {/* Emoji grid */}
                <div className="space-y-2">
                  {EMOJI_PRESETS.map((group) => (
                    <div key={group.label}>
                      <p className="text-[#555555] text-[10px] mb-1">{group.label}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {group.emojis.map((e) => (
                          <button
                            key={e}
                            type="button"
                            onClick={() => setCustomEmoji(e)}
                            className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all ${
                              customEmoji === e
                                ? 'ring-2 ring-offset-1 ring-offset-[#161616]'
                                : 'bg-[#222222] hover:bg-[#2A2A2A]'
                            }`}
                            style={customEmoji === e ? { backgroundColor: 'var(--accent)' } : undefined}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div>
                    <p className="text-[#555555] text-[10px] mb-1">自訂</p>
                    <input
                      type="text"
                      value={customEmoji}
                      onChange={(e) => setCustomEmoji(e.target.value)}
                      className="w-12 bg-[#222222] border border-[rgba(255,255,255,0.08)] rounded-lg px-2 py-2 text-white text-center text-lg focus:outline-none"
                      maxLength={2}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="景點名稱"
                    className="flex-1 bg-[#222222] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444444] focus:outline-none focus:border-[rgba(255,255,255,0.2)]"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[#888888] text-xs block mb-1">停留時間（分鐘）</label>
                    <input
                      type="number"
                      value={customDuration}
                      onChange={(e) => setCustomDuration(Number(e.target.value))}
                      min={15}
                      max={480}
                      className="w-full bg-[#222222] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[#888888] text-xs block mb-1">類型</label>
                    <input
                      type="text"
                      value={customType}
                      onChange={(e) => setCustomType(e.target.value)}
                      className="w-full bg-[#222222] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCustom(false)}
                    className="flex-1 py-2 rounded-xl bg-[#222222] text-[#888888] text-sm hover:text-white transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAddCustom}
                    disabled={!customName.trim() || addingCustom}
                    className="flex-1 py-2 rounded-xl text-white text-sm font-medium transition-opacity disabled:opacity-40 hover:opacity-80"
                    style={{ backgroundColor: 'var(--accent)' }}
                  >
                    {addingCustom ? '加入中...' : '加入'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
