import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DocumentStatusBadge from '../DocumentStatusBadge';

describe('DocumentStatusBadge', () => {
  it('renders Draft label for draft status', () => {
    render(<DocumentStatusBadge status="draft" />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders Pending Signature label for pending status', () => {
    render(<DocumentStatusBadge status="pending" />);
    expect(screen.getByText('Pending Signature')).toBeInTheDocument();
  });

  it('renders Client Signed label for client_signed status', () => {
    render(<DocumentStatusBadge status="client_signed" />);
    expect(screen.getByText('Client Signed')).toBeInTheDocument();
  });

  it('renders Fully Executed label for fully_executed status', () => {
    render(<DocumentStatusBadge status="fully_executed" />);
    expect(screen.getByText('Fully Executed')).toBeInTheDocument();
  });

  it('uses custom labels when provided', () => {
    render(<DocumentStatusBadge status="draft" labels={{ draft: 'Borrador' }} />);
    expect(screen.getByText('Borrador')).toBeInTheDocument();
  });

  it('applies correct CSS class for draft', () => {
    render(<DocumentStatusBadge status="draft" />);
    const badge = screen.getByText('Draft');
    expect(badge.className).toContain('bg-zinc-700');
  });

  it('applies correct CSS class for pending', () => {
    render(<DocumentStatusBadge status="pending" />);
    const badge = screen.getByText('Pending Signature');
    expect(badge.className).toContain('bg-blue-500/20');
  });

  it('handles unknown status gracefully (falls back to draft style)', () => {
    // @ts-expect-error — testing invalid input
    const { container } = render(<DocumentStatusBadge status="unknown" />);
    // Should render without crashing; falls back to draft config
    const badge = container.querySelector('span');
    expect(badge).toBeInTheDocument();
    expect(badge?.className).toContain('bg-zinc-700');
  });
});
