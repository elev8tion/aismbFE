import { describe, it, expect } from 'vitest';
import { generateMSA } from '../msa';
import { ContractData } from '../../types';

const mockData: ContractData = {
  company_name: 'Test Corp',
  client_name: 'Jane Smith',
  client_email: 'jane@test.com',
  client_title: 'CEO',
  tier: 'foundation',
  tierName: 'Foundation Builder',
  fees: { setup_cents: 500000, monthly_cents: 150000 },
  min_months: 3,
  effective_date: '2026-02-07',
};

describe('generateMSA', () => {
  it('contains Master Services Agreement title', () => {
    const html = generateMSA(mockData);
    expect(html).toContain('Master Services Agreement');
  });

  it('contains company name', () => {
    const html = generateMSA(mockData);
    expect(html).toContain('Test Corp');
  });

  it('contains effective date', () => {
    const html = generateMSA(mockData);
    expect(html).toContain('2026-02-07');
  });

  it('contains key section headers', () => {
    const html = generateMSA(mockData);
    const sections = [
      '1. Services',
      '2. Independent Contractor',
      '3. Client Responsibilities',
      '4. AI Systems',
      '9. Intellectual Property',
      '13. Limitation of Liability',
      '17. Governing Law',
      '18. Entire Agreement',
    ];
    for (const section of sections) {
      expect(html).toContain(section);
    }
  });

  it('contains letterhead', () => {
    const html = generateMSA(mockData);
    expect(html).toContain('ELEV8TION LLC');
  });

  it('contains footer', () => {
    const html = generateMSA(mockData);
    expect(html).toContain('part of the agreement');
  });

  it('contains signature block with client defaults', () => {
    const html = generateMSA(mockData);
    expect(html).toContain('Name: Jane Smith');
    expect(html).toContain('Test Corp');
  });

  it('uses custom signatures when provided', () => {
    const html = generateMSA(mockData, {
      adminName: 'KC',
      adminTitle: 'CEO',
      clientName: 'Custom Name',
    });
    expect(html).toContain('Name: KC');
    expect(html).toContain('Name: Custom Name');
  });
});
