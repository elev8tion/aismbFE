import type { Config } from "tailwindcss";
import { colors } from "./styles/colors";
import { spacing, breakpoints } from "./styles/spacing";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        functional: colors.functional,
        neutral: colors.neutral,
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
      },
      fontSize: {
        'h1-desktop': ['48px', '56px'],
        'h1-mobile': ['36px', '44px'],
        'h2-desktop': ['36px', '44px'],
        'h2-mobile': ['28px', '36px'],
        'h3': ['24px', '32px'],
        'h4': ['20px', '28px'],
        'body-desktop': ['16px', '26px'],
        'body-mobile': ['18px', '29px'],
        'small': ['14px', '22px'],
      },
      spacing: {
        xs: spacing.xs,
        sm: spacing.sm,
        md: spacing.md,
        lg: spacing.lg,
        xl: spacing.xl,
        '2xl': spacing['2xl'],
        '3xl': spacing['3xl'],
        '4xl': spacing['4xl'],
      },
      screens: {
        'sm': breakpoints.sm,
        'md': breakpoints.md,
        'tablet': breakpoints.tablet,
        'desktop': breakpoints.desktop,
        'wide': breakpoints.wide,
      },
    },
  },
  plugins: [],
};

export default config;
