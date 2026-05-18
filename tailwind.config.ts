import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#080808',
        'card-bg': '#111111',
        'card-bg-2': '#161616',
        'border-subtle': 'rgba(255,255,255,0.08)',
        'text-primary': '#F5F5F5',
        'text-muted': '#888888',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans TC', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
