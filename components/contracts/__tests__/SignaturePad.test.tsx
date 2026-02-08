import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignaturePad from '../SignaturePad';

describe('SignaturePad', () => {
  const mockOnComplete = vi.fn();

  it('renders name input with default label', () => {
    render(<SignaturePad onComplete={mockOnComplete} />);
    expect(screen.getByText('Full Legal Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type your full name')).toBeInTheDocument();
  });

  it('renders name input with custom label', () => {
    render(<SignaturePad onComplete={mockOnComplete} nameLabel="Nombre Legal" />);
    expect(screen.getByText('Nombre Legal')).toBeInTheDocument();
  });

  it('disables input when disabled prop is true', () => {
    render(<SignaturePad onComplete={mockOnComplete} disabled />);
    const input = screen.getByPlaceholderText('Type your full name');
    expect(input).toBeDisabled();
  });

  it('shows Signing... when disabled', () => {
    render(<SignaturePad onComplete={mockOnComplete} disabled />);
    expect(screen.getByText('Signing...')).toBeInTheDocument();
  });

  it('shows Confirm Signature button when not disabled', () => {
    render(<SignaturePad onComplete={mockOnComplete} />);
    expect(screen.getByText('Confirm Signature')).toBeInTheDocument();
  });

  it('submit button is disabled when name is empty', () => {
    render(<SignaturePad onComplete={mockOnComplete} />);
    const btn = screen.getByText('Confirm Signature');
    expect(btn).toBeDisabled();
  });

  it('has a clear button', () => {
    render(<SignaturePad onComplete={mockOnComplete} />);
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('displays current date', () => {
    render(<SignaturePad onComplete={mockOnComplete} />);
    const dateText = screen.getByText(/Date:/);
    expect(dateText).toBeInTheDocument();
  });
});
