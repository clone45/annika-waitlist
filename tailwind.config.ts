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
        'annika-pink': '#ff6b9d',
        'annika-purple': '#c084fc',
        'annika-dark': '#1a1a2e',
      },
    },
  },
  plugins: [],
}
export default config
