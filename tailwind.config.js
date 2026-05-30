/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        ink: '#111827',
        body: '#374151',
        muted: '#6B7280',
        line: '#E5E7EB',
        lineBlue: '#DDE7F8',
        page: '#F9FBFF',
      },
      boxShadow: {
        card: '0 10px 30px rgba(37, 99, 235, 0.07)',
        soft: '0 8px 20px rgba(17, 24, 39, 0.06)',
      },
    },
  },
  plugins: [],
};
