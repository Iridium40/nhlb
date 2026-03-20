import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    './emails/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        body: ['Lato', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        script: ['Dancing Script', 'cursive'],
      },
      colors: {
        brand: {
          DEFAULT: '#B8311F',
          dark: '#8B2015',
          deep: '#6B1510',
          hover: '#9E2919',
        },
        blush: {
          DEFAULT: '#D4A898',
          light: '#F0E0D8',
        },
        cream: {
          DEFAULT: '#FDFAF8',
          dark: '#F5EDE8',
        },
        nhlb: {
          text: '#3D1A14',
          muted: '#9A5A50',
          border: '#E8D0C8',
        },
      },
    },
  },
  plugins: [],
}

export default config
