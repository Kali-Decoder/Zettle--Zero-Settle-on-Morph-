import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary)',
          light: 'var(--primary-light)',
          dark: 'var(--primary-dark)',
          foreground: 'var(--primary-foreground)',
        },
        accent: {
          1: 'var(--accent-1)',
          2: 'var(--accent-2)',
        },
        neutral: {
          50: 'var(--neutral-50)',
          100: 'var(--neutral-100)',
          200: 'var(--neutral-200)',
          300: 'var(--neutral-300)',
          400: 'var(--neutral-400)',
          500: 'var(--neutral-500)',
          600: 'var(--neutral-600)',
          700: 'var(--neutral-700)',
          800: 'var(--neutral-800)',
          900: 'var(--neutral-900)',
        },
      },
      fontFamily: {
        roboto: ['var(--font-roboto)'],
        'open-sans': ['var(--font-open-sans)'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(to right, var(--primary), var(--primary-dark))',
        'gradient-accent': 'linear-gradient(135deg, var(--accent-1), var(--accent-2))',
      },
    },
  },
  plugins: [],
};
export default config;
