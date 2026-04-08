// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // CRUCIAL: Scans all your React components
  ],
  theme: {
    extend: {
        colors: {
            // Your custom, colorful palette
            'pec-blue': '#2E86C1', 
            'pec-green': '#2ECC71', 
            'pec-yellow': '#F4D03F',
            // You can add other custom colors here
        }
    },
  },
  plugins: [],
}