import { describe, it, expect } from 'vitest';
import { contractSignedTemplate } from '../contractSignedTemplate';

describe('contractSignedTemplate', () => {
  const data = {
    clientName: 'Jane Smith',
    companyName: 'Test Corp',
    tier: 'Foundation Builder',
    partnershipId: 42,
  };

  it('contains Action Required badge', () => {
    const html = contractSignedTemplate(data);
    expect(html).toContain('Action Required');
  });

  it('contains client name', () => {
    const html = contractSignedTemplate(data);
    expect(html).toContain('Jane Smith');
  });

  it('contains company name', () => {
    const html = contractSignedTemplate(data);
    expect(html).toContain('Test Corp');
  });

  it('contains tier', () => {
    const html = contractSignedTemplate(data);
    expect(html).toContain('Foundation Builder');
  });

  it('contains partnership ID with hash prefix', () => {
    const html = contractSignedTemplate(data);
    expect(html).toContain('#42');
  });

  it('instructs admin to counter-sign', () => {
    const html = contractSignedTemplate(data);
    expect(html).toContain('counter-sign');
  });
});
