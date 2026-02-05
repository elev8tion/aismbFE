// Design System - Typography
// Shared with AI SMB Partners Landing Page

export const typography = {
  // Font Family
  fontFamily: {
    primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },

  // Font Weights
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Font Sizes & Line Heights (Desktop / Mobile)
  scale: {
    h1: {
      desktop: { size: '48px', lineHeight: '56px' },
      mobile: { size: '36px', lineHeight: '44px' },
    },
    h2: {
      desktop: { size: '36px', lineHeight: '44px' },
      mobile: { size: '28px', lineHeight: '36px' },
    },
    h3: {
      size: '24px',
      lineHeight: '32px',
    },
    h4: {
      size: '20px',
      lineHeight: '28px',
    },
    body: {
      desktop: { size: '16px', lineHeight: '26px' },
      mobile: { size: '18px', lineHeight: '29px' },
    },
    small: {
      size: '14px',
      lineHeight: '22px',
    },
  },

  // Modular Scale Ratio: 1.25
  // Reasoning: Creates harmony across sizes
} as const;

export type TypographyTheme = typeof typography;
