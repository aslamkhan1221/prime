/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cyan / Sky Blue palette inspired by "PRINT & SERVICES" and cyan ink splash
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#00a3e0',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        // Process Magenta palette inspired by middle splash droplet and dot on 'i'
        magenta: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f472b6',
          400: '#f43f5e',
          500: '#ec008c',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        // Warm Gold / Process Yellow palette inspired by left splash droplet
        splashAmber: {
          300: '#fde047',
          400: '#ffd100',
          500: '#f59e0b',
          600: '#d97706',
        },
        // Iconic CMYK Process Print Colors
        cmyk: {
          cyan: '#00a3e0',
          magenta: '#ec008c',
          yellow: '#ffd100',
          black: '#111827',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
