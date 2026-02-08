import { render, type RenderOptions } from '@testing-library/react';
import { LanguageProvider } from '@/contexts/LanguageContext';

function AllProviders({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export { render } from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
