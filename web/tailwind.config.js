/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/contexts/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        'background': '#121212',
        'surface': '#1e1e1e',
        'border': '#333333',
        'primary': '#ffffff',
        'secondary': '#a0a0a0',
      },
    },
  },
  plugins: [],
}
