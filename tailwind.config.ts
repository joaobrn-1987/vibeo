import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Nunito", "Inter", "sans-serif"],
      },
      colors: {
        // Brand cream background
        cream: {
          50: "#FEFCF8",
          100: "#FAF7F2",
          200: "#F5EFE6",
          300: "#EDE3D5",
        },
        // Primary blue (from PDF)
        primary: {
          50: "#EBF1F8",
          100: "#C5D8ED",
          200: "#9FBEE2",
          300: "#79A4D7",
          400: "#5B8FC9",
          500: "#4A6FA5",
          600: "#3A5A8A",
          700: "#2E4870",
          800: "#213556",
          900: "#15223C",
        },
        // Accent rose/pink (from PDF)
        accent: {
          50: "#FDF0F1",
          100: "#F5D5D8",
          200: "#EDBABE",
          300: "#E09FA4",
          400: "#D4909A",
          500: "#C4717A",
          600: "#B05A63",
          700: "#8F454D",
          800: "#6E3037",
          900: "#4D1C21",
        },
        // Light blue (from PDF)
        sky: {
          50: "#EEF4F8",
          100: "#D4E5EF",
          200: "#BAD6E5",
          300: "#A0C7DB",
          400: "#87B8D1",
          500: "#6DA9C7",
          600: "#4A8DAD",
          700: "#367088",
          800: "#235363",
          900: "#10363E",
        },
        // Theme Feminine
        feminine: {
          primary: "#C4717A",
          secondary: "#E8C4C8",
          accent: "#4A6FA5",
          light: "#FDF0F1",
        },
        // Theme Masculine
        masculine: {
          primary: "#2E5F8A",
          secondary: "#4A6FA5",
          accent: "#1A3A5C",
          light: "#EBF1F8",
        },
        // Theme Diversity
        diversity: {
          primary: "#7B5EA7",
          secondary: "#4A9B8E",
          accent: "#E8853A",
          light: "#F3EFF8",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        soft: "0 2px 20px rgba(74, 111, 165, 0.08)",
        card: "0 4px 24px rgba(74, 111, 165, 0.10)",
        hover: "0 8px 32px rgba(74, 111, 165, 0.16)",
        glow: "0 0 40px rgba(74, 111, 165, 0.20)",
      },
      backgroundImage: {
        "gradient-feminine": "linear-gradient(135deg, #C4717A 0%, #4A6FA5 100%)",
        "gradient-masculine": "linear-gradient(135deg, #2E5F8A 0%, #1A3A5C 100%)",
        "gradient-diversity": "linear-gradient(135deg, #7B5EA7 0%, #4A9B8E 100%)",
        "gradient-cream": "linear-gradient(180deg, #FAF7F2 0%, #F5EFE6 100%)",
        "gradient-hero": "linear-gradient(135deg, #FAF7F2 0%, #EBF1F8 50%, #FDF0F1 100%)",
        "blob-pink": "radial-gradient(circle, #E8C4C8 0%, transparent 70%)",
        "blob-blue": "radial-gradient(circle, #C5D8ED 0%, transparent 70%)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-in-right": "slideInRight 0.4s ease-out",
        "bounce-gentle": "bounceGentle 2s infinite",
        "pulse-soft": "pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        bounceGentle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
