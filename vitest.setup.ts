import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import React from 'react';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock next/image — React.createElement to avoid JSX in .ts
vi.mock('next/image', () => ({
  default: vi.fn().mockImplementation((props: Record<string, unknown>) => {
    const { fill, priority, ...rest } = props;
    return React.createElement('img', rest);
  }),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: vi.fn().mockImplementation(({ children, ...rest }: { children: React.ReactNode; href: string }) => {
    return React.createElement('a', rest, children);
  }),
}));

// Mock Canvas API for SignaturePad
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  scale: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  clearRect: vi.fn(),
  lineCap: 'round',
  lineJoin: 'round',
  lineWidth: 2,
  strokeStyle: '#1a1a2e',
});

HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,mock');

Element.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
  width: 400,
  height: 150,
  top: 0,
  left: 0,
  bottom: 150,
  right: 400,
  x: 0,
  y: 0,
  toJSON: vi.fn(),
});
