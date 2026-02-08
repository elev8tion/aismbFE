import { describe, it, expect } from 'vitest';
import { signingRequestTemplate } from '../signingRequestTemplate';

describe('signingRequestTemplate', () => {
  const data = {
    clientName: 'John Doe',
    companyName: 'Acme Inc',
    signingUrl: 'https://app.kre8tion.com/sign/abc123',
  };

  it('contains client name', () => {
    const html = signingRequestTemplate(data);
    expect(html).toContain('John Doe');
  });

  it('contains company name', () => {
    const html = signingRequestTemplate(data);
    expect(html).toContain('Acme Inc');
  });

  it('contains signing URL as href', () => {
    const html = signingRequestTemplate(data);
    expect(html).toContain('href="https://app.kre8tion.com/sign/abc123"');
  });

  it('contains 7-day expiry notice', () => {
    const html = signingRequestTemplate(data);
    expect(html).toContain('7 days');
  });

  it('contains document list items', () => {
    const html = signingRequestTemplate(data);
    expect(html).toContain('Master Services Agreement');
    expect(html).toContain('Statement of Work');
    expect(html).toContain('Addendum');
  });

  it('starts with DOCTYPE', () => {
    const html = signingRequestTemplate(data);
    expect(html).toMatch(/^<!DOCTYPE html>/);
  });
});
