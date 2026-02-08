import { describe, it, expect } from 'vitest';
import { generateAddendum } from '../addendum';
import { ContractData } from '../../types';

const mockData: ContractData = {
  company_name: 'Test Corp',
  client_name: 'Jane Smith',
  client_email: 'jane@test.com',
  client_title: 'CEO',
  tier: 'discovery',
  tierName: 'AI Discovery',
  fees: { setup_cents: 250000, monthly_cents: 75000 },
  min_months: 2,
  effective_date: '2026-02-07',
};

describe('generateAddendum', () => {
  it('contains AI & Automation addendum heading', () => {
    const html = generateAddendum(mockData);
    expect(html).toContain('AI &amp; Automation Services Addendum');
  });

  it('contains Data Processing Addendum heading', () => {
    const html = generateAddendum(mockData);
    expect(html).toContain('Data Processing Addendum');
  });

  it('contains company name', () => {
    const html = generateAddendum(mockData);
    expect(html).toContain('Test Corp');
  });

  it('contains effective date', () => {
    const html = generateAddendum(mockData);
    expect(html).toContain('2026-02-07');
  });

  it('contains key AI addendum section headers', () => {
    const html = generateAddendum(mockData);
    const sections = [
      '1. Nature of AI Systems',
      '2. Human Review Requirement',
      '3. Automation',
      '8. Limitation of Liability for AI Systems',
      '9. Acceptance of Risk',
    ];
    for (const section of sections) {
      expect(html).toContain(section);
    }
  });

  it('contains key DPA section headers', () => {
    const html = generateAddendum(mockData);
    const sections = [
      '1. Role of Parties',
      '2. Types of Data',
      '6. Data Retention',
      '7. Security',
    ];
    for (const section of sections) {
      expect(html).toContain(section);
    }
  });
});
