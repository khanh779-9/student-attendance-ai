/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          50: "#f1f5ff",
          100: "#e0e7ff",
          700: "#334155",
          800: "#1e293b",
        },
      },
      borderRadius: {
        panel: "1rem",
      },
      boxShadow: {
        panel: "0 8px 30px rgba(0, 0, 0, 0.04), 0 4px 10px rgba(0, 0, 0, 0.02)",
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

