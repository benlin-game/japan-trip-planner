import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Trip Planner | 旅遊行程規劃',
  description: '多人協作的旅遊行程規劃工具，支援即時同步、AI助理、預算追蹤',
  keywords: '旅遊規劃, 行程規劃, 多人協作, AI旅遊助理',
  openGraph: {
    title: 'Trip Planner',
    description: '一起規劃你的旅程',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-dark-bg text-text-primary min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
