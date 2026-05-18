'use client'

interface Airline {
  code: string
  name: string
  nameEn: string
  emoji: string
  color: string
}

interface Props {
  airline: Airline
  url: string
}

export default function FlightCard({ airline, url }: Props) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-xl p-4 card-hover transition-all hover:border-[rgba(255,255,255,0.15)]"
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: `${airline.color}20` }}
        >
          <span style={{ color: airline.color }}>{airline.emoji}</span>
        </div>
        <div>
          <p className="text-white font-medium text-sm">{airline.name}</p>
          <p className="text-[#888888] text-[10px]">{airline.nameEn}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[#888888] text-xs">{airline.code}</span>
        <div className="flex items-center gap-1 text-[#888888] text-xs hover:text-white transition-colors">
          <span>Google Flights</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </div>
      </div>
    </a>
  )
}
