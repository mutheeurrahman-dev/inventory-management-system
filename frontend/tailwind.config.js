/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Roboto'", "sans-serif"],
        body:    ["'Roboto'", "sans-serif"],
        mono:    ["'Roboto Mono'", "monospace"],
      },
      colors: {
        fk: {
          blue:     "#2874f0",
          bluedark: "#1a5dc8",
          bluelight:"#4a8af4",
          yellow:   "#ffe01b",
          yellowbg: "#fff7e0",
          orange:   "#ff6161",
          orangedk: "#e05a00",
          green:    "#388e3c",
          greenlt:  "#e8f5e9",
          red:      "#ff4a4a",
          redlt:    "#fff0f0",
          amber:    "#ff9f00",
          amberlt:  "#fff3e0",
          gray50:   "#f1f3f6",
          gray100:  "#e0e0e0",
          gray200:  "#c2c2c2",
          gray400:  "#878787",
          gray600:  "#525252",
          gray800:  "#2e2e2e",
          white:    "#ffffff",
        },
      },
      boxShadow: {
        "fk-card":    "0 2px 4px 0 rgba(0,0,0,.08)",
        "fk-hover":   "0 4px 16px 0 rgba(0,0,0,.12)",
        "fk-modal":   "0 4px 24px 0 rgba(0,0,0,.20)",
        "fk-header":  "0 1px 2px 0 rgba(0,0,0,.20)",
      },
      animation: {
        "slide-in":  "slideIn 0.25s ease both",
        "fade-up":   "fadeUp 0.3s ease both",
        "pulse-dot": "pulseDot 2s infinite",
      },
      keyframes: {
        slideIn:  { from: { opacity: 0, transform: "translateX(16px)" }, to: { opacity: 1, transform: "translateX(0)" } },
        fadeUp:   { from: { opacity: 0, transform: "translateY(10px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        pulseDot: { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.3 } },
      },
    },
  },
  plugins: [],
};
