import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DocumentViewer from '../DocumentViewer';

const mockHtml = {
  msa: '<p>MSA Content</p>',
  sow: '<p>SOW Content</p>',
  addendum: '<p>Addendum Content</p>',
};

describe('DocumentViewer', () => {
  it('renders 3 tab buttons', () => {
    render(<DocumentViewer html={mockHtml} />);
    expect(screen.getByText('MSA')).toBeInTheDocument();
    expect(screen.getByText('SOW')).toBeInTheDocument();
    expect(screen.getByText('AI Addendum')).toBeInTheDocument();
  });

  it('shows MSA content initially', () => {
    render(<DocumentViewer html={mockHtml} />);
    expect(screen.getByText('MSA Content')).toBeInTheDocument();
  });

  it('switches to SOW tab on click', async () => {
    const user = userEvent.setup();
    render(<DocumentViewer html={mockHtml} />);
    await user.click(screen.getByText('SOW'));
    expect(screen.getByText('SOW Content')).toBeInTheDocument();
  });

  it('uses custom labels when provided', () => {
    render(<DocumentViewer html={mockHtml} labels={{ msa: 'Acuerdo Marco' }} />);
    expect(screen.getByText('Acuerdo Marco')).toBeInTheDocument();
  });

  it('shows initial progress as 0/3', () => {
    render(<DocumentViewer html={mockHtml} />);
    expect(screen.getByText(/0\/3/)).toBeInTheDocument();
  });

  it('shows scroll hint text', () => {
    render(<DocumentViewer html={mockHtml} />);
    expect(screen.getByText(/Scroll to bottom/)).toBeInTheDocument();
  });
});
