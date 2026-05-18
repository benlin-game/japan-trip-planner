'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ChatMessage, ItineraryItem, Trip } from '@/types'

interface Props {
  params: { id: string }
}

export default function ChatPage({ params }: Props) {
  const { id: tripId } = params
  const [trip, setTrip] = useState<Trip | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [items, setItems] = useState<ItineraryItem[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

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
    scrollToBottom()
  }, [messages])

  async function loadData() {
    const storedName = (() => {
      try {
        const s = localStorage.getItem('japan-trips')
        if (s) {
          const t = JSON.parse(s).find((e: { tripId: string }) => e.tripId === tripId)
          return t?.userName ?? ''
        }
      } catch { /* ignore */ }
      return ''
    })()

    const msgQuery = storedName
      ? supabase.from('chat_messages').select('*').eq('trip_id', tripId).eq('user_name', storedName).order('created_at')
      : supabase.from('chat_messages').select('*').eq('trip_id', tripId).is('user_name', null).order('created_at')

    const [tripRes, msgRes, itemsRes] = await Promise.all([
      supabase.from('trips').select('*').eq('id', tripId).single(),
      msgQuery,
      supabase.from('itinerary_items').select('*').eq('trip_id', tripId).order('day').order('order_index'),
    ])
    if (tripRes.data) setTrip(tripRes.data as Trip)
    if (msgRes.data) setMessages(msgRes.data as ChatMessage[])
    if (itemsRes.data) setItems(itemsRes.data as ItineraryItem[])
    setLoading(false)
  }

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function buildTripContext() {
    if (!trip) return {}

    const itinerarySummary: Array<{ day: number; spots: string[] }> = []
    for (let d = 1; d <= trip.days; d++) {
      const dayItems = items
        .filter((i) => i.day === d)
        .sort((a, b) => a.order_index - b.order_index)
      if (dayItems.length > 0) {
        itinerarySummary.push({
          day: d,
          spots: dayItems.map((i) => `${i.spot_emoji}${i.spot_name}`),
        })
      }
    }

    return {
      name: trip.name,
      destination: trip.destination,
      days: trip.days,
      passengers: trip.passengers,
      depart_date: trip.depart_date,
      itinerary: itinerarySummary,
    }
  }

  async function handleSend() {
    if (!input.trim() || sending) return

    const userMessage = input.trim()
    setInput('')
    setSending(true)

    // Optimistic UI: add user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      trip_id: tripId,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMsg])

    try {
      // Save user message to DB
      const { data: savedUserMsg } = await supabase
        .from('chat_messages')
        .insert({
          trip_id: tripId,
          role: 'user',
          content: userMessage,
          user_name: userName || null,
        })
        .select()
        .single()

      if (savedUserMsg) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempUserMsg.id ? (savedUserMsg as ChatMessage) : m))
        )
      }

      // Call Gemini API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          tripContext: buildTripContext(),
          history: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? 'AI 回應失敗')
      }

      const assistantContent: string = data.content

      // Save assistant message
      const { data: savedAssistantMsg } = await supabase
        .from('chat_messages')
        .insert({
          trip_id: tripId,
          role: 'assistant',
          content: assistantContent,
          user_name: userName || null,
        })
        .select()
        .single()

      if (savedAssistantMsg) {
        setMessages((prev) => [...prev, savedAssistantMsg as ChatMessage])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            trip_id: tripId,
            role: 'assistant',
            content: assistantContent,
            created_at: new Date().toISOString(),
          },
        ])
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'AI 助理暫時無法回應'
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          trip_id: tripId,
          role: 'assistant',
          content: `抱歉，${errMsg}。請稍後再試。`,
          created_at: new Date().toISOString(),
        },
      ])
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const SUGGESTIONS = [
    '推薦行程中的必吃美食',
    '有什麼省錢的交通方式？',
    '行李清單有什麼建議？',
    '當地天氣穿著建議',
  ]

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl mb-3">🤖</div>
          <p className="text-[#888888] text-sm">載入對話記錄...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-[480px] mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🤖</div>
              <p className="text-white font-medium text-sm mb-1">AI 旅遊助理</p>
              <p className="text-[#888888] text-xs mb-6">
                我了解你的{trip?.destination}旅程，可以問我任何問題！
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setInput(s)
                      inputRef.current?.focus()
                    }}
                    className="bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-xl px-3 py-2.5 text-[#888888] text-xs text-left hover:border-[rgba(255,255,255,0.2)] hover:text-white transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-[#222222] flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-0.5">
                  🤖
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'text-white rounded-tr-sm'
                    : 'bg-[#1A1A1A] text-[#F5F5F5] rounded-tl-sm border border-[rgba(255,255,255,0.08)]'
                }`}
                style={
                  msg.role === 'user'
                    ? { backgroundColor: 'var(--accent)' }
                    : undefined
                }
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start animate-fade-in">
              <div className="w-7 h-7 rounded-full bg-[#222222] flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-0.5">
                🤖
              </div>
              <div className="bg-[#1A1A1A] border border-[rgba(255,255,255,0.08)] rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1.5 items-center">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-[#888888] animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-[rgba(255,255,255,0.08)] bg-[#0D0D0D] px-4 py-3">
        <div className="max-w-[480px] mx-auto flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`問問關於${trip?.destination ?? '日本'}旅遊的問題...`}
            rows={1}
            disabled={sending}
            className="flex-1 bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-white text-sm placeholder-[#555555] resize-none focus:outline-none focus:border-[rgba(255,255,255,0.2)] transition-colors disabled:opacity-50"
            style={{ minHeight: '44px', maxHeight: '120px' }}
            onInput={(e) => {
              const t = e.currentTarget
              t.style.height = 'auto'
              t.style.height = `${Math.min(t.scrollHeight, 120)}px`
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40 hover:opacity-80"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <svg className="w-5 h-5 text-white rotate-90" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
        <p className="max-w-[480px] mx-auto text-[#444444] text-[10px] mt-2 text-center">
          Enter 送出 · Shift+Enter 換行
        </p>
      </div>
    </div>
  )
}
