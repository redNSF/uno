/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        casino: {
          gold: '#D4AF37',
          'gold-light': '#F0D060',
          'gold-dark': '#A07820',
          felt: '#1A3A2A',
          'felt-light': '#244D38',
          'felt-dark': '#0F2218',
          dark: '#0A0A0F',
          'dark-mid': '#12121A',
          'dark-surface': '#1A1A28',
        },
        card: {
          red: '#E53E3E',
          blue: '#3182CE',
          green: '#38A169',
          yellow: '#ECC94B',
          wild: '#7B2FBE',
        },
        player: {
          crimson: '#DC143C',
          cobalt: '#0047AB',
          amber: '#FFBF00',
          emerald: '#50C878',
          violet: '#8B00FF',
          rose: '#FF007F',
          cyan: '#00FFFF',
        },
        ui: {
          toast: 'rgba(10, 10, 15, 0.9)',
          panel: 'rgba(18, 18, 26, 0.85)',
          overlay: 'rgba(0, 0, 0, 0.75)',
        },
      },
      fontFamily: {
        display: ['Cinzel', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'gold-glow': '0 0 20px rgba(212, 175, 55, 0.5), 0 0 40px rgba(212, 175, 55, 0.2)',
        'player-glow': '0 0 15px rgba(212, 175, 55, 0.5), 0 0 30px rgba(212, 175, 55, 0.2)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.8), 0 0 16px rgba(212,175,55,0.3)',
        'uno-button': '0 0 20px rgba(229, 62, 62, 0.7), 0 0 40px rgba(229, 62, 62, 0.3)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #D4AF37 0%, #F0D060 50%, #A07820 100%)',
        'felt-gradient': 'radial-gradient(ellipse at center, #1A3A2A 0%, #0F2218 100%)',
        'dark-gradient': 'linear-gradient(180deg, #0A0A0F 0%, #12121A 100%)',
        'card-back': 'radial-gradient(ellipse at center, #1a0a2e 0%, #0d0618 100%)',
      },
      animation: {
        'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'bounce-uno': 'bounce-uno 1s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'glow-ring': 'glow-ring 2s ease-in-out infinite',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-up': 'slide-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fade-in 0.3s ease-out',
        'countdown-ring': 'countdown-ring 15s linear forwards',
      },
      keyframes: {
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(212, 175, 55, 0.9), 0 0 60px rgba(212, 175, 55, 0.4)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'bounce-uno': {
          '0%, 100%': { transform: 'scale(1) translateY(0)' },
          '50%': { transform: 'scale(1.06) translateY(-4px)' },
        },
        'glow-ring': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-up': {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          from: { transform: 'scale(0.9)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'countdown-ring': {
          from: { strokeDashoffset: '0' },
          to: { strokeDashoffset: '283' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
