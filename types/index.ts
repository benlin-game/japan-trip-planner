export type Destination = string

export interface Trip {
  id: string
  name: string
  destination: string
  days: number
  depart_date: string
  passengers: number
  invite_code: string
  created_by: string
  created_at: string
}

export interface TripMember {
  id: string
  trip_id: string
  user_name: string
  joined_at: string
}

export interface ItineraryItem {
  id: string
  trip_id: string
  day: number
  spot_id: string
  spot_name: string
  spot_emoji: string
  spot_type: string
  duration: number
  order_index: number
  added_by: string
  created_at: string
  start_time?: string | null
  lat?: number | null
  lng?: number | null
}

export interface ChatMessage {
  id: string
  trip_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface Budget {
  id: string
  trip_id: string
  member_name: string
  category: BudgetCategory
  amount: number
  created_at: string
}

export type BudgetCategory = '機票' | '住宿' | '餐飲' | '交通' | '購物' | '活動'

export interface Spot {
  id: string
  name: string
  nameEn: string
  destination: Destination
  type: string
  emoji: string
  duration: number
  openTime: string
  tip: string
  lat: number
  lng: number
}

export interface LocalTripEntry {
  tripId: string
  userName: string
  tripName: string
  destination: Destination
  joinedAt: string
}

export interface TripContext {
  name: string
  destination: string
  days: number
  passengers: number
  depart_date: string
  itinerary?: Array<{
    day: number
    spots: string[]
  }>
}

export interface PresenceUser {
  name: string
  online_at: string
}
