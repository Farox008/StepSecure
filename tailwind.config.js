/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#FFFFFE',
                surface: '#F2F3F5',
                border: '#E5E7EB',
            },
            fontFamily: {
                sans: ['DM Sans', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
