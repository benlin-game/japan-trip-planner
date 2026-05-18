'use client'

import { useEffect, useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { supabase } from '@/lib/supabase'
import ItineraryDay from '@/components/ItineraryDay'
import SpotPicker from '@/components/SpotPicker'
import ExportPDF from '@/components/ExportPDF'
import type { ItineraryItem, Trip } from '@/types'
import { calculateStartTime } from '@/lib/utils'

interface Props {
  params: { id: string }
}

export default function ItineraryPage({ params }: Props) {
  const { id: tripId } = params
  const [trip, setTrip] = useState<Trip | null>(null)
  const [items, setItems] = useState<ItineraryItem[]>([])
  const [activeDay, setActiveDay] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showSpotPicker, setShowSpotPicker] = useState(false)
  const [showTransportPicker, setShowTransportPicker] = useState(false)
  const [userName, setUserName] = useState('')
  const [dayStartTimes, setDayStartTimes] = useState<Record<number, string>>({})
  const [customTransportName, setCustomTransportName] = useState('')
  const [customTransportEmoji, setCustomTransportEmoji] = useState('🚗')
  const [customTransportDuration, setCustomTransportDuration] = useState(20)
  const [addingTransport, setAddingTransport] = useState(false)

  const TRANSPORT_PRESETS = [
    { emoji: '🚶', name: '步行', duration: 10 },
    { emoji: '🚃', name: '電車', duration: 30 },
    { emoji: '🚌', name: '巴士', duration: 20 },
    { emoji: '🚗', name: '計程車', duration: 15 },
    { emoji: '🛺', name: '嘟嘟車', duration: 20 },
    { emoji: '🚢', name: '渡輪', duration: 40 },
    { emoji: '🛫', name: '機場交通', duration: 60 },
    { emoji: '🚁', name: '直升機', duration: 30 },
  ]

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    loadData()
    try {
      const stored = localStorage.getItem('japan-trips')
      if (stored) {
        const trips = JSON.parse(stored)
        const entry = trips.find((t: { tripId: string }) => t.tripId === tripId)
        if (entry) setUserName(entry.userName)
      }
    } catch { /* ignore */ }
  }, [tripId])

  useEffect(() => {
    const channel = supabase
      .channel(`itinerary-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'itinerary_items',
          filter: `trip_id=eq.${tripId}`,
        },
        () => { loadItems() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tripId])

  async function loadData() {
    const [tripRes, itemsRes] = await Promise.all([
      supabase.from('trips').select('*').eq('id', tripId).single(),
      supabase.from('itinerary_items').select('*').eq('trip_id', tripId).order('day').order('order_index'),
    ])
    if (tripRes.data) setTrip(tripRes.data as Trip)
    if (itemsRes.data) setItems(itemsRes.data as ItineraryItem[])
    setLoading(false)
  }

  async function loadItems() {
    const { data } = await supabase
      .from('itinerary_items').select('*').eq('trip_id', tripId).order('day').order('order_index')
    if (data) setItems(data as ItineraryItem[])
  }

  const dayItems = items
    .filter((item) => item.day === activeDay)
    .sort((a, b) => a.order_index - b.order_index)

  const dayStart = dayStartTimes[activeDay] ?? '09:00'
  const timeSlots = dayItems.map((_, idx) => {
    const prevDurations = dayItems.slice(0, idx).map((i) => i.duration)
    return calculateStartTime(dayStart, prevDurations, 0)
  })

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = dayItems.findIndex((i) => i.id === active.id)
    const newIndex = dayItems.findIndex((i) => i.id === over.id)
    const reordered = arrayMove(dayItems, oldIndex, newIndex)

    const otherItems = items.filter((i) => i.day !== activeDay)
    setItems([
      ...otherItems,
      ...reordered.map((item, idx) => ({ ...item, order_index: idx })),
    ])

    await Promise.all(
      reordered.map((item, idx) =>
        supabase.from('itinerary_items').update({ order_index: idx }).eq('id', item.id)
      )
    )
  }

  async function handleEditItem(
    itemId: string,
    updates: Pick<ItineraryItem, 'spot_name' | 'spot_emoji' | 'spot_type' | 'duration'>
  ) {
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, ...updates } : i)))
    await supabase.from('itinerary_items').update(updates).eq('id', itemId)
  }

  async function handleRemoveItem(itemId: string) {
    setItems((prev) => prev.filter((i) => i.id !== itemId))
    await supabase.from('itinerary_items').delete().eq('id', itemId)
  }

  async function handleAddTransport(emoji: string, name: string, duration: number) {
    setAddingTransport(true)
    const maxOrder = dayItems.length
    await supabase.from('itinerary_items').insert({
      trip_id: tripId,
      day: activeDay,
      spot_id: `transport-${Date.now()}`,
      spot_name: name,
      spot_emoji: emoji,
      spot_type: '交通',
      duration,
      order_index: maxOrder,
      added_by: userName || '旅伴',
    })
    await loadItems()
    setAddingTransport(false)
    setShowTransportPicker(false)
    setCustomTransportName('')
    setCustomTransportDuration(20)
    setCustomTransportEmoji('🚗')
  }

  async function handleSpotAdded() {
    setShowSpotPicker(false)
    await loadItems()
  }

  if (loading) {
    return (
      <div className="flex-1 p-4 max-w-[480px] mx-auto">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!trip) return null

  const days = Array.from({ length: trip.days }, (_, i) => i + 1)

  return (
    <div className="flex flex-col h-full">
      {/* Day selector */}
      <div className="bg-[#080808] border-b border-[rgba(255,255,255,0.08)] sticky top-0 z-30">
        <div className="max-w-[480px] mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
            {days.map((day) => {
              const dayItemCount = items.filter((i) => i.day === day).length
              const isActive = day === activeDay
              return (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`flex-shrink-0 flex flex-col items-center px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive ? 'text-white' : 'text-[#888888] hover:text-white'
                  }`}
                  style={isActive ? { backgroundColor: 'var(--accent)' } : { backgroundColor: '#161616' }}
                >
                  <span>Day {day}</span>
                  {dayItemCount > 0 && (
                    <span className={`text-[10px] mt-0.5 ${isActive ? 'text-white/80' : 'text-[#888888]'}`}>
                      {dayItemCount}個景點
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Itinerary content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[480px] mx-auto px-4 py-4">
          {/* Day settings row */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[#888888] text-xs">起始</span>
            <input
              type="time"
              value={dayStart}
              onChange={(e) => setDayStartTimes((prev) => ({ ...prev, [activeDay]: e.target.value }))}
              className="bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-[rgba(255,255,255,0.2)] [color-scheme:dark]"
            />
          </div>

          {dayItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">🗓️</div>
              <p className="text-[#888888] text-sm mb-4">Day {activeDay} 還沒有景點</p>
              <button
                onClick={() => setShowSpotPicker(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-80"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                新增景點
              </button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={dayItems.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {dayItems.map((item, idx) => (
                    <ItineraryDay
                      key={item.id}
                      item={item}
                      startTime={timeSlots[idx]}
                      onRemove={handleRemoveItem}
                      onEdit={handleEditItem}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {dayItems.length > 0 && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowSpotPicker(true)}
                className="flex-1 py-3 rounded-xl border-2 border-dashed border-[rgba(255,255,255,0.15)] text-[#888888] text-sm font-medium hover:border-[rgba(255,255,255,0.3)] hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-lg leading-none">+</span>
                新增景點
              </button>
              <button
                onClick={() => setShowTransportPicker(true)}
                className="flex-1 py-3 rounded-xl border-2 border-dashed border-[rgba(0,206,209,0.3)] text-[#00CED1] text-sm font-medium hover:border-[rgba(0,206,209,0.6)] hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-lg leading-none">🚗</span>
                新增交通
              </button>
            </div>
          )}

          {items.length > 0 && (
            <div className="mt-6">
              <ExportPDF trip={trip} items={items} />
            </div>
          )}
        </div>
      </div>

      {showSpotPicker && (
        <SpotPicker
          tripId={tripId}
          destination={trip.destination}
          day={activeDay}
          userName={userName}
          existingItems={dayItems}
          onClose={() => setShowSpotPicker(false)}
          onAdded={handleSpotAdded}
        />
      )}

      {showTransportPicker && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70"
          onClick={(e) => e.target === e.currentTarget && setShowTransportPicker(false)}
        >
          <div className="w-full max-w-[480px] bg-[#111111] rounded-t-3xl border-t border-[rgba(255,255,255,0.08)] animate-slide-up">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[rgba(255,255,255,0.08)]">
              <h2 className="text-white text-lg font-semibold">新增交通 · Day {activeDay}</h2>
              <button
                onClick={() => setShowTransportPicker(false)}
                className="w-8 h-8 rounded-full bg-[#222222] flex items-center justify-center text-[#888888] hover:text-white transition-colors"
              >✕</button>
            </div>

            <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto pb-8">
              {/* Presets */}
              <div className="grid grid-cols-4 gap-2">
                {TRANSPORT_PRESETS.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => handleAddTransport(t.emoji, t.name, t.duration)}
                    disabled={addingTransport}
                    className="bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-xl p-3 flex flex-col items-center gap-1.5 hover:border-[rgba(0,206,209,0.4)] transition-colors disabled:opacity-50"
                  >
                    <span className="text-2xl">{t.emoji}</span>
                    <span className="text-white text-xs font-medium">{t.name}</span>
                    <span className="text-[#888888] text-[10px]">{t.duration}分鐘</span>
                  </button>
                ))}
              </div>

              {/* Custom */}
              <div className="border-t border-[rgba(255,255,255,0.08)] pt-4">
                <p className="text-[#888888] text-xs mb-3">自訂交通</p>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={customTransportEmoji}
                    onChange={(e) => setCustomTransportEmoji(e.target.value)}
                    className="w-12 bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-xl px-2 py-2 text-white text-center text-lg focus:outline-none"
                    maxLength={2}
                  />
                  <input
                    type="text"
                    value={customTransportName}
                    onChange={(e) => setCustomTransportName(e.target.value)}
                    placeholder="交通方式名稱"
                    className="flex-1 bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-xl px-3 py-2 text-white text-sm placeholder-[#444444] focus:outline-none focus:border-[rgba(255,255,255,0.2)]"
                  />
                  <input
                    type="number"
                    value={customTransportDuration}
                    onChange={(e) => setCustomTransportDuration(Number(e.target.value))}
                    min={1}
                    max={480}
                    className="w-16 bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-xl px-2 py-2 text-white text-sm text-center focus:outline-none"
                  />
                  <span className="text-[#888888] text-xs self-center">分</span>
                </div>
                <button
                  onClick={() => handleAddTransport(customTransportEmoji, customTransportName.trim() || '交通', customTransportDuration)}
                  disabled={addingTransport || !customTransportName.trim()}
                  className="w-full py-3 rounded-xl text-white text-sm font-medium transition-opacity disabled:opacity-40 hover:opacity-80"
                  style={{ backgroundColor: '#00CED1' }}
                >
                  {addingTransport ? '加入中...' : '加入自訂交通'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
