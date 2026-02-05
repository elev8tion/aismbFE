// Design System - Modern 2025 Color Palette
// Shared with AI SMB Partners Landing Page

export const colors = {
  // Primary Palette - Electric Blue Gradients
  primary: {
    deepBlue: '#0F172A',    // Deep navy for headers & contrast
    techBlue: '#0284C7',    // Tech electric blue for primary elements
    electricBlue: '#0EA5E9', // Bright electric blue for interactive elements
    cyan: '#06B6D4',        // Cyan for innovation/AI elements
  },

  // Secondary - Electric Blue Shades
  secondary: {
    deepBlue: '#075985',   // Deep electric blue for depth
    blue: '#0EA5E9',       // Vibrant electric blue
    lightBlue: '#38BDF8',  // Light electric blue
  },

  // Accent Colors
  accent: {
    amber: '#F59E0B',      // Warm amber for CTAs
    orange: '#F97316',     // Energetic orange
    emerald: '#10B981',    // Success green
    rose: '#F43F5E',       // Attention/error
  },

  // Functional Colors
  functional: {
    success: '#10B981',    // Modern emerald green
    warning: '#F59E0B',    // Amber warning
    error: '#EF4444',      // Modern red
    info: '#3B82F6',       // Blue info
  },

  // Neutral Grays - Updated for modern contrast
  neutral: {
    950: '#0A0A0A',        // Near black
    900: '#18181B',        // Dark gray
    800: '#27272A',        // Charcoal
    700: '#3F3F46',        // Medium dark
    600: '#52525B',        // Medium
    500: '#71717A',        // Mid gray
    400: '#A1A1AA',        // Light medium
    300: '#D4D4D8',        // Light
    200: '#E4E4E7',        // Very light
    100: '#F4F4F5',        // Off white
    50: '#FAFAFA',         // Almost white
    white: '#FFFFFF',      // Pure white
  },

  // Gradient Definitions (Electric Blue Theme)
  gradients: {
    hero: 'linear-gradient(135deg, #0284C7 0%, #0EA5E9 50%, #06B6D4 100%)',
    card: 'linear-gradient(135deg, #075985 0%, #0EA5E9 100%)',
    cta: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
    subtle: 'linear-gradient(135deg, #F4F4F5 0%, #E4E4E7 100%)',
  },

  // Glassmorphism Effects (2025 Trend)
  glass: {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.2)',
    dark: 'rgba(0, 0, 0, 0.1)',
  },
} as const;

export type ColorTheme = typeof colors;
