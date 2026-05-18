'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ItineraryItem } from '@/types'

interface Props {
  item: ItineraryItem
  startTime: string
  onRemove: (id: string) => void
  onEdit: (id: string, updates: Pick<ItineraryItem, 'spot_name' | 'spot_emoji' | 'spot_type' | 'duration'>) => void
}

const EMOJI_PRESETS = [
  { label: '餐飲', emojis: ['🍜', '🍣', '🍱', '🍕', '🍔', '🥘', '🍺', '☕', '🧋', '🍦'] },
  { label: '住宿', emojis: ['🏨', '🏠', '🏡', '🛏️', '🏩'] },
  { label: '交通', emojis: ['🚗', '🚌', '🚃', '🚢', '🛺', '🚁', '🚞'] },
  { label: '景點', emojis: ['⛩️', '🗼', '🏯', '🎡', '🏖️', '🎭', '🏛️', '🗿'] },
  { label: '購物', emojis: ['🛍️', '🏪', '💎', '👗'] },
  { label: '其他', emojis: ['📍', '🎯', '⭐', '🎪', '📸', '🎵'] },
]

export default function ItineraryDay({ item, startTime, onRemove, onEdit }: Props) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(item.spot_name)
  const [editEmoji, setEditEmoji] = useState(item.spot_emoji)
  const [editDuration, setEditDuration] = useState(item.duration)
  const [editType, setEditType] = useState(item.spot_type)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : undefined,
  }

  const endTime = addMinutes(startTime, item.duration)

  function handleSave() {
    if (!editName.trim()) return
    onEdit(item.id, {
      spot_name: editName.trim(),
      spot_emoji: editEmoji,
      spot_type: editType.trim() || '其他',
      duration: editDuration,
    })
    setEditing(false)
  }

  function handleCancelEdit() {
    setEditName(item.spot_name)
    setEditEmoji(item.spot_emoji)
    setEditDuration(item.duration)
    setEditType(item.spot_type)
    setEditing(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex gap-3 animate-fade-in ${isDragging ? 'cursor-grabbing' : ''}`}
    >
      {/* Time column */}
      <div className="flex flex-col items-center w-12 flex-shrink-0">
        <span className={`text-xs font-medium tabular-nums ${item.spot_type === '交通' ? 'text-[#555555]' : 'text-white'}`}>
          {startTime}
        </span>
        <div className={`w-px flex-1 my-1 ${item.spot_type === '交通' ? 'bg-[rgba(255,255,255,0.04)]' : 'bg-[rgba(255,255,255,0.08)]'}`} />
        <span className={`text-[10px] tabular-nums ${item.spot_type === '交通' ? 'text-[#444444]' : 'text-[#888888]'}`}>
          {endTime}
        </span>
      </div>

      {/* Card */}
      <div className={`flex-1 rounded-xl p-3 border ${
        item.spot_type === '交通'
          ? 'bg-[#0E0E0E] border-[rgba(255,255,255,0.04)]'
          : 'bg-[#161616] border-[rgba(255,255,255,0.08)]'
      }`}>
        {editing ? (
          <div className="space-y-3">
            {/* Emoji grid */}
            <div className="space-y-1.5">
              {EMOJI_PRESETS.map((group) => (
                <div key={group.label}>
                  <p className="text-[#555555] text-[10px] mb-1">{group.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.emojis.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setEditEmoji(e)}
                        className={`w-7 h-7 rounded-lg text-base flex items-center justify-center transition-all ${
                          editEmoji === e ? 'ring-2 ring-offset-1 ring-offset-[#161616]' : 'bg-[#222222] hover:bg-[#2A2A2A]'
                        }`}
                        style={editEmoji === e ? { backgroundColor: 'var(--accent)' } : undefined}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[#555555] text-[10px]">自訂</p>
                <input
                  type="text"
                  value={editEmoji}
                  onChange={(e) => setEditEmoji(e.target.value)}
                  className="w-10 bg-[#222222] border border-[rgba(255,255,255,0.08)] rounded-lg px-1 py-1 text-white text-center text-base focus:outline-none"
                  maxLength={2}
                />
              </div>
            </div>

            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="景點名稱"
              className="w-full bg-[#222222] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444444] focus:outline-none focus:border-[rgba(255,255,255,0.2)]"
            />

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[#888888] text-[10px] block mb-1">停留（分鐘）</label>
                <input
                  type="number"
                  value={editDuration}
                  onChange={(e) => setEditDuration(Number(e.target.value))}
                  min={15}
                  max={480}
                  className="w-full bg-[#222222] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="text-[#888888] text-[10px] block mb-1">類型</label>
                <input
                  type="text"
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="w-full bg-[#222222] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCancelEdit}
                className="flex-1 py-2 rounded-xl bg-[#222222] text-[#888888] text-sm hover:text-white transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!editName.trim()}
                className="flex-1 py-2 rounded-xl text-white text-sm font-medium transition-opacity disabled:opacity-40 hover:opacity-80"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                儲存
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              {...attributes}
              {...listeners}
              className="text-[#444444] hover:text-[#888888] transition-colors cursor-grab active:cursor-grabbing p-1 -m-1 flex-shrink-0"
              aria-label="拖動排序"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 110 4 2 2 0 010-4zm6 0a2 2 0 110 4 2 2 0 010-4zM7 8a2 2 0 110 4 2 2 0 010-4zm6 0a2 2 0 110 4 2 2 0 010-4zM7 14a2 2 0 110 4 2 2 0 010-4zm6 0a2 2 0 110 4 2 2 0 010-4z" />
              </svg>
            </button>

            <span className="text-2xl flex-shrink-0">{item.spot_emoji}</span>

            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${item.spot_type === '交通' ? 'text-[#888888]' : 'text-white'}`}>
                {item.spot_name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[#555555] text-[10px]">{item.spot_type}</span>
                <span className="text-[#444444] text-[10px]">·</span>
                <span className="text-[#555555] text-[10px]">{item.duration}分鐘</span>
                {item.added_by && item.spot_type !== '交通' && (
                  <>
                    <span className="text-[#444444] text-[10px]">·</span>
                    <span className="text-[#555555] text-[10px]">by {item.added_by}</span>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={() => setEditing(true)}
              className="text-[#555555] hover:text-[#aaaaaa] transition-colors p-1 -m-1 flex-shrink-0"
              aria-label="編輯景點"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>

            <button
              onClick={() => onRemove(item.id)}
              className="text-[#555555] hover:text-red-400 transition-colors p-1 -m-1 flex-shrink-0"
              aria-label="移除景點"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  const newH = Math.floor(total / 60) % 24
  const newM = total % 60
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
}
