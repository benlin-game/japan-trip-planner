import { redirect } from 'next/navigation'

interface Props {
  params: { id: string }
}

export default function TripRootPage({ params }: Props) {
  redirect(`/trip/${params.id}/itinerary`)
}
