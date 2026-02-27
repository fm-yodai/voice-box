import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // プリミティブカラー（藍色系）
        ai: {
          50: "#e8f4f8",
          100: "#c5dfe8",
          200: "#9dc5d6",
          300: "#6fa8c1",
          400: "#4790ac",
          500: "#165e83",
          600: "#124e6d",
          700: "#0e3e57",
          800: "#0a2e41",
          900: "#0f2350",
        },
        // 紅色系
        kurenai: {
          50: "#fce8ed",
          100: "#f5b8c7",
          500: "#d7003a",
          700: "#b7282e",
          900: "#8b0020",
        },
        // 朱色
        shu: { 500: "#eb6101" },
        // 山吹色
        yamabuki: { 500: "#f8b500" },
        // 萌黄色
        moegi: { 500: "#aacf53" },
        // 常磐色
        tokiwa: { 500: "#007b43" },
        // ニュートラル（伝統名）
        gofun: "#fffffc",
        kinari: "#fbfaf5",
        shironeri: "#f3f3f3",
        nezumi: "#949495",
        "gin-nezu": "#afafb0",
        sumi: "#595857",
        shikkoku: "#0d0015",
        kogane: "#e6b422",
        // セマンティックカラー（CSS変数参照）
        brand: {
          primary: "var(--color-brand-primary)",
          "primary-hover": "var(--color-brand-primary-hover)",
          "primary-active": "var(--color-brand-primary-active)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
        },
        surface: {
          primary: "var(--color-bg-primary)",
          secondary: "var(--color-bg-secondary)",
          DEFAULT: "var(--color-bg-surface)",
          inverse: "var(--color-bg-inverse)",
        },
        content: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
          inverse: "var(--color-text-inverse)",
        },
        feedback: {
          success: "var(--color-success)",
          warning: "var(--color-warning)",
          error: "var(--color-error)",
          info: "var(--color-info)",
        },
      },
      fontFamily: {
        body: ["Noto Sans JP", "Hiragino Kaku Gothic ProN", "sans-serif"],
        heading: ["Shippori Mincho", "Noto Serif JP", "serif"],
        display: ["Zen Antique", "Shippori Mincho", "serif"],
        mono: ["Noto Sans Mono", "monospace"],
      },
      fontSize: {
        xs: "0.64rem",
        sm: "0.8rem",
        base: "1rem",
        lg: "1.25rem",
        xl: "1.563rem",
        "2xl": "1.953rem",
        "3xl": "2.441rem",
        "4xl": "3.052rem",
      },
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(13, 0, 21, 0.05)",
        DEFAULT: "0 4px 6px rgba(13, 0, 21, 0.07)",
        lg: "0 10px 15px rgba(13, 0, 21, 0.1)",
        xl: "0 20px 25px rgba(13, 0, 21, 0.12)",
      },
      transitionDuration: {
        fast: "150ms",
        normal: "250ms",
        slow: "400ms",
      },
      lineHeight: {
        tight: "1.25",
        normal: "1.6",
        relaxed: "1.8",
      },
    },
  },
  plugins: [],
} satisfies Config;
