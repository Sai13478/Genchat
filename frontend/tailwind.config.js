import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      }
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        genchat: {
          "primary": "#2563eb",
          "secondary": "#7dd3fc",
          "accent": "#0ea5e9",
          "neutral": "#1f2937",
          "base-100": "#ffffff",
          "base-200": "#f8fafc",
          "base-300": "#f1f5f9",
          "base-content": "#1e293b",
          "--rounded-box": "1.5rem",
          "--rounded-btn": "1rem",
          "--rounded-badge": "1.9rem",
          "--animation-btn": "0.25s",
          "--animation-input": "0.2s",
          "--btn-focus-scale": "0.95",
        },
      },
    ],
  },
};
