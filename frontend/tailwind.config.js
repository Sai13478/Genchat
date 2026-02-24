import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.15)',
      }
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        "genchat-light": {
          "primary": "#2563eb",
          "secondary": "#7dd3fc",
          "accent": "#0ea5e9",
          "neutral": "#1f2937",
          "base-100": "#ffffff",
          "base-200": "#f8fafc",
          "base-300": "#f4f7fb",
          "base-content": "#1e293b",
          "--rounded-box": "2rem",
          "--rounded-btn": "1.2rem",
          "--rounded-badge": "1.9rem",
          "--animation-btn": "0.25s",
          "--animation-input": "0.2s",
          "--btn-focus-scale": "0.95",
        },
      },
      {
        "genchat-dark": {
          "primary": "#3b82f6",
          "secondary": "#0ea5e9",
          "accent": "#60a5fa",
          "neutral": "#f8fafc",
          "base-100": "#020617",
          "base-200": "#0f172a",
          "base-300": "#1e293b",
          "base-content": "#f8fafc",
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
