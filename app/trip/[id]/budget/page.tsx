'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import BudgetForm from '@/components/BudgetForm'
import type { Budget, Trip } from '@/types'
import { BUDGET_CATEGORIES, CATEGORY_COLORS, formatJPY, formatTWD } from '@/lib/utils'

interface Props {
  params: { id: string }
}

export default function BudgetPage({ params }: Props) {
  const { id: tripId } = params
  const [trip, setTrip] = useState<Trip | null>(null)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

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

  async function loadData() {
    const [tripRes, budgetsRes] = await Promise.all([
      supabase.from('trips').select('*').eq('id', tripId).single(),
      supabase.from('budgets').select('*').eq('trip_id', tripId).order('created_at'),
    ])
    if (tripRes.data) setTrip(tripRes.data as Trip)
    if (budgetsRes.data) setBudgets(budgetsRes.data as Budget[])
    setLoading(false)
  }

  async function handleDelete(id: string) {
    setDeleteId(id)
    setBudgets((prev) => prev.filter((b) => b.id !== id))
    await supabase.from('budgets').delete().eq('id', id)
    setDeleteId(null)
  }

  function handleAdded(budget: Budget) {
    setBudgets((prev) => [...prev, budget])
    setShowForm(false)
  }

  const totalJPY = budgets.reduce((sum, b) => sum + b.amount, 0)
  const perPerson = trip ? Math.round(totalJPY / trip.passengers) : 0

  // Category breakdown
  const byCategory = BUDGET_CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat] = budgets.filter((b) => b.category === cat).reduce((s, b) => s + b.amount, 0)
      return acc
    },
    {} as Record<string, number>
  )

  // Member breakdown
  const members = [...new Set(budgets.map((b) => b.member_name))]
  const byMember = members.map((name) => ({
    name,
    total: budgets.filter((b) => b.member_name === name).reduce((s, b) => s + b.amount, 0),
  }))

  if (loading) {
    return (
      <div className="flex-1 p-4 max-w-[480px] mx-auto">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[480px] mx-auto px-4 py-4">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-xl p-3 text-center">
            <div className="text-[#888888] text-[10px] mb-1">總花費</div>
            <div className="text-white font-bold text-sm">{formatJPY(totalJPY)}</div>
            <div className="text-[#888888] text-[10px] mt-0.5">{formatTWD(totalJPY)}</div>
          </div>
          <div className="bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-xl p-3 text-center">
            <div className="text-[#888888] text-[10px] mb-1">人均花費</div>
            <div className="text-white font-bold text-sm">{formatJPY(perPerson)}</div>
            <div className="text-[#888888] text-[10px] mt-0.5">{formatTWD(perPerson)}</div>
          </div>
          <div className="bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-xl p-3 text-center">
            <div className="text-[#888888] text-[10px] mb-1">筆數</div>
            <div className="text-white font-bold text-sm">{budgets.length}</div>
            <div className="text-[#888888] text-[10px] mt-0.5">{trip?.passengers ?? 0}人</div>
          </div>
        </div>

        {/* Category breakdown */}
        {totalJPY > 0 && (
          <div className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-xl p-4 mb-4">
            <h3 className="text-white text-sm font-medium mb-3">分類統計</h3>
            <div className="space-y-2">
              {BUDGET_CATEGORIES.filter((cat) => byCategory[cat] > 0).map((cat) => {
                const pct = totalJPY > 0 ? (byCategory[cat] / totalJPY) * 100 : 0
                const color = CATEGORY_COLORS[cat] ?? '#888888'
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[#888888] text-xs">{cat}</span>
                      <span className="text-white text-xs">{formatJPY(byCategory[cat])}</span>
                    </div>
                    <div className="h-1.5 bg-[#222222] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Per member breakdown */}
        {byMember.length > 0 && (
          <div className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-xl p-4 mb-4">
            <h3 className="text-white text-sm font-medium mb-3">成員花費</h3>
            <div className="space-y-2">
              {byMember.map((m) => (
                <div key={m.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      {m.name.charAt(0)}
                    </div>
                    <span className="text-[#888888] text-xs">{m.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white text-xs font-medium">{formatJPY(m.total)}</div>
                    <div className="text-[#888888] text-[10px]">{formatTWD(m.total)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add expense button */}
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 rounded-xl text-white text-sm font-medium mb-4 transition-opacity hover:opacity-80"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          + 新增費用
        </button>

        {/* Expense list */}
        {budgets.length > 0 ? (
          <div>
            <h3 className="text-[#888888] text-xs font-medium uppercase tracking-wider mb-3">
              費用明細
            </h3>
            <div className="space-y-2">
              {budgets.slice().reverse().map((budget) => {
                const color = CATEGORY_COLORS[budget.category] ?? '#888888'
                return (
                  <div
                    key={budget.id}
                    className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-xl p-3 flex items-center gap-3"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <span style={{ color }}>{getCategoryEmoji(budget.category)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium">{formatJPY(budget.amount)}</span>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: `${color}20`, color }}
                        >
                          {budget.category}
                        </span>
                      </div>
                      <div className="text-[#888888] text-xs mt-0.5">{budget.member_name}</div>
                    </div>
                    <button
                      onClick={() => handleDelete(budget.id)}
                      disabled={deleteId === budget.id}
                      className="text-[#666666] hover:text-red-400 transition-colors p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">💰</div>
            <p className="text-[#888888] text-sm">還沒有費用記錄</p>
          </div>
        )}
      </div>

      {showForm && (
        <BudgetForm
          tripId={tripId}
          defaultMember={userName}
          onClose={() => setShowForm(false)}
          onAdded={handleAdded}
        />
      )}
    </div>
  )
}

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    '機票': '✈️',
    '住宿': '🏨',
    '餐飲': '🍜',
    '交通': '🚃',
    '購物': '🛍️',
    '活動': '🎡',
  }
  return map[category] ?? '💴'
}
