'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Budget, BudgetCategory } from '@/types'
import { BUDGET_CATEGORIES, CATEGORY_COLORS } from '@/lib/utils'

interface Props {
  tripId: string
  defaultMember: string
  onClose: () => void
  onAdded: (budget: Budget) => void
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

export default function BudgetForm({ tripId, defaultMember, onClose, onAdded }: Props) {
  const [category, setCategory] = useState<BudgetCategory>('餐飲')
  const [amount, setAmount] = useState('')
  const [memberName, setMemberName] = useState(defaultMember)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amountNum = parseInt(amount.replace(/,/g, ''), 10)
    if (!amountNum || amountNum <= 0) {
      setError('請輸入有效金額')
      return
    }
    if (!memberName.trim()) {
      setError('請輸入姓名')
      return
    }
    setLoading(true)
    setError('')

    try {
      const { data, error: dbErr } = await supabase
        .from('budgets')
        .insert({
          trip_id: tripId,
          member_name: memberName.trim(),
          category,
          amount: amountNum,
        })
        .select()
        .single()

      if (dbErr || !data) {
        setError('儲存失敗，請稍後再試')
        return
      }

      onAdded(data as Budget)
    } catch {
      setError('網路錯誤')
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
          <h2 className="text-white text-lg font-semibold">新增費用</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#222222] flex items-center justify-center text-[#888888] hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 pb-10">
          {/* Category */}
          <div>
            <label className="block text-[#888888] text-xs mb-2">費用分類</label>
            <div className="grid grid-cols-3 gap-2">
              {BUDGET_CATEGORIES.map((cat) => {
                const color = CATEGORY_COLORS[cat] ?? '#888888'
                const isActive = category === cat
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-all border ${
                      isActive
                        ? 'text-white border-transparent'
                        : 'bg-[#161616] text-[#888888] border-[rgba(255,255,255,0.08)] hover:text-white'
                    }`}
                    style={
                      isActive
                        ? { backgroundColor: color, borderColor: color }
                        : undefined
                    }
                  >
                    <span>{getCategoryEmoji(cat)}</span>
                    <span>{cat}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-[#888888] text-xs mb-1.5">金額（日圓 JPY）</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#888888] text-sm">¥</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min={1}
                className="w-full bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-xl pl-8 pr-4 py-3 text-white text-sm placeholder-[#444444] focus:outline-none focus:border-[rgba(255,255,255,0.2)]"
              />
            </div>
            {amount && Number(amount) > 0 && (
              <p className="text-[#888888] text-xs mt-1">
                約 NT$ {Math.round(Number(amount) * 0.22).toLocaleString()}
              </p>
            )}
          </div>

          {/* Member name */}
          <div>
            <label className="block text-[#888888] text-xs mb-1.5">誰付的</label>
            <input
              type="text"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="輸入姓名"
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
            disabled={loading}
            className="w-full py-4 rounded-xl text-white font-semibold text-base transition-opacity disabled:opacity-50 hover:opacity-90"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {loading ? '儲存中...' : '儲存費用 💰'}
          </button>
        </form>
      </div>
    </div>
  )
}
