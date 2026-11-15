/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#176B57',
          hover: '#125646',
          light: '#E8F3EE',
        },
        secondary: {
          DEFAULT: '#174A73',
          hover: '#123B5C',
          light: '#EAF1F8',
        },
        beige: {
          DEFAULT: '#F2E9D8',
          dark: '#E5D6BC',
        },
        surface: {
          DEFAULT: '#F8FAF9',
          card: '#FFFFFF',
        },
        ink: {
          DEFAULT: '#1F2937',
          muted: '#64748B',
        },
        border: {
          DEFAULT: '#DCE5E1',
        },
        urgent: {
          DEFAULT: '#C0392B',
          hover: '#A32F23',
          light: '#FDEDEC',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Nunito Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        btn: '10px',
      },
      boxShadow: {
        card: '0 2px 8px -2px rgba(23, 74, 115, 0.06), 0 1px 3px -1px rgba(23, 107, 87, 0.04)',
        cardHover: '0 8px 20px -4px rgba(23, 74, 115, 0.10), 0 2px 6px -1px rgba(23, 107, 87, 0.06)',
      }
    },
  },
  plugins: [],
};
