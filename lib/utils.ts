export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

const DESTINATION_COLORS: Record<string, string> = {
  '東京': '#FF6B35',
  '大阪': '#FFB800',
  '京都': '#9B59B6',
  '福岡': '#E74C3C',
  '沖繩': '#00CED1',
  '札幌': '#3498DB',
}

const COLOR_PALETTE = ['#FF6B35', '#FFB800', '#9B59B6', '#00CED1', '#3498DB', '#2ECC71', '#E74C3C', '#F39C12']

export const DESTINATION_IATA: Record<string, string> = {
  '東京': 'TYO',
  '大阪': 'OSA',
  '京都': 'ITM',
  '福岡': 'FUK',
  '沖繩': 'OKA',
  '札幌': 'CTS',
}

export const BUDGET_CATEGORIES = ['機票', '住宿', '餐飲', '交通', '購物', '活動'] as const

export const CATEGORY_COLORS: Record<string, string> = {
  '機票': '#FF6B35',
  '住宿': '#FFB800',
  '餐飲': '#00CED1',
  '交通': '#3498DB',
  '購物': '#9B59B6',
  '活動': '#2ECC71',
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

export function calculateStartTime(
  baseTime: string,
  previousDurations: number[],
  travelBuffer = 15
): string {
  const [hours, minutes] = baseTime.split(':').map(Number)
  let totalMinutes = hours * 60 + minutes

  for (const duration of previousDurations) {
    totalMinutes += duration + travelBuffer
  }

  const h = Math.floor(totalMinutes / 60) % 24
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function formatJPY(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatTWD(amountJPY: number): string {
  const twd = Math.round(amountJPY * 0.22)
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
  }).format(twd)
}

export function getDestinationColor(destination: string): string {
  if (DESTINATION_COLORS[destination]) return DESTINATION_COLORS[destination]
  let hash = 0
  for (let i = 0; i < destination.length; i++) hash = destination.charCodeAt(i) + ((hash << 5) - hash)
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length]
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength) + '...'
}
