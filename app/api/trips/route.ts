import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, destination, days, depart_date, passengers, created_by } = body

    if (!name || !destination || !days || !depart_date || !passengers || !created_by) {
      return NextResponse.json(
        { error: '缺少必要欄位' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    const inviteCode = generateInviteCode()

    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        name,
        destination,
        days: Number(days),
        depart_date,
        passengers: Number(passengers),
        invite_code: inviteCode,
        created_by,
      })
      .select()
      .single()

    if (tripError) {
      console.error('Trip creation error:', tripError)
      return NextResponse.json(
        { error: '建立旅程失敗：' + tripError.message },
        { status: 500 }
      )
    }

    // Add the creator as the first member
    const { error: memberError } = await supabase
      .from('trip_members')
      .insert({
        trip_id: trip.id,
        user_name: created_by,
      })

    if (memberError) {
      console.error('Member creation error:', memberError)
    }

    return NextResponse.json({
      id: trip.id,
      invite_code: trip.invite_code,
      name: trip.name,
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json(
      { error: '伺服器錯誤，請稍後再試' },
      { status: 500 }
    )
  }
}
