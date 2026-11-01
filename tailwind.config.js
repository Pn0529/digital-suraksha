/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#effaf6',
          100: '#d7f3e9',
          200: '#b7e7d5',
          300: '#7fd4b1',
          400: '#4cb88d',
          500: '#23956d',
          600: '#1c7a5c',
          700: '#176049',
          800: '#134d3d',
          900: '#0f3d32'
        },
        accent: '#f59e0b',
        danger: '#dc2626',
        ink: '#0f172a'
      },
      boxShadow: {
        soft: '0 20px 45px rgba(15, 23, 42, 0.10)'
      }
    }
  },
  plugins: []
}
