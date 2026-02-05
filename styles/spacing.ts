// Design System - Spacing System
// Based on 8px grid system for consistency

export const spacing = {
  xs: '4px',    // 0.5 × base
  sm: '8px',    // 1 × base
  md: '16px',   // 2 × base
  lg: '24px',   // 3 × base
  xl: '32px',   // 4 × base
  '2xl': '48px', // 6 × base
  '3xl': '64px', // 8 × base
  '4xl': '96px', // 12 × base
} as const;

// Container widths for responsive design
export const containers = {
  mobile: '100%',
  tablet: '768px',
  desktop: '1024px',
  wide: '1440px',
} as const;

// Breakpoints (Mobile-first)
export const breakpoints = {
  sm: '320px',   // Small phones
  md: '480px',   // Modern phones
  tablet: '768px',
  desktop: '1024px',
  wide: '1440px',
} as const;

export type SpacingTheme = typeof spacing;
