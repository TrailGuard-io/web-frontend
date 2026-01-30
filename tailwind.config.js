/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["Plus Jakarta Sans", "sans-serif"],
      },
      colors: {
        ink: "#0f1b2d",
        "ink-muted": "#4b5563",
        accent: "#0f1b2d",
        "accent-soft": "#e6eefc",
        surface: "#ffffff",
        "surface-muted": "#f7f9fc",
        danger: "#e02424",
        "danger-soft": "#fde8e8",
        ocean: "#d9ebf2",
      },
      boxShadow: {
        soft: "0 18px 40px rgba(15, 23, 42, 0.12)",
        card: "0 12px 28px rgba(15, 23, 42, 0.08)",
        pill: "0 10px 20px rgba(15, 23, 42, 0.12)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: 0, transform: "translateY(18px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { opacity: 0, transform: "translateX(-12px)" },
          "100%": { opacity: 1, transform: "translateX(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.04)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease both",
        "slide-in": "slide-in 0.5s ease both",
        "pulse-soft": "pulse-soft 2.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
