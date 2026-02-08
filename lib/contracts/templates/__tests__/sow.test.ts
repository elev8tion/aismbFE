import { describe, it, expect } from 'vitest';
import { generateSOW } from '../sow';
import { ContractData } from '../../types';

function makeMockData(overrides?: Partial<ContractData>): ContractData {
  return {
    company_name: 'Test Corp',
    client_name: 'Jane Smith',
    client_email: 'jane@test.com',
    client_title: 'CEO',
    tier: 'discovery',
    tierName: 'AI Discovery',
    fees: { setup_cents: 250000, monthly_cents: 75000 },
    min_months: 2,
    effective_date: '2026-02-07',
    ...overrides,
  };
}

describe('generateSOW', () => {
  it('contains Statement of Work title', () => {
    const html = generateSOW(makeMockData());
    expect(html).toContain('Statement of Work');
  });

  it('contains company name', () => {
    const html = generateSOW(makeMockData());
    expect(html).toContain('Test Corp');
  });

  it('formats setup fee from cents to dollars', () => {
    const html = generateSOW(makeMockData());
    expect(html).toContain('$2,500');
  });

  it('formats monthly fee from cents to dollars', () => {
    const html = generateSOW(makeMockData());
    expect(html).toContain('$750');
  });

  it('calculates total minimum investment', () => {
    // discovery: 250000 + (75000 * 2) = 400000 cents = $4,000
    const html = generateSOW(makeMockData());
    expect(html).toContain('$4,000');
  });

  it('shows discovery tier includes (4 items)', () => {
    const html = generateSOW(makeMockData({ tier: 'discovery' }));
    expect(html).toContain('Foundational AI training');
    expect(html).toContain('Workflow identification');
    expect(html).toContain('Guided system setup');
    expect(html).toContain('Capability transfer sessions');
  });

  it('shows foundation tier includes (4 items)', () => {
    const html = generateSOW(makeMockData({ tier: 'foundation' }));
    expect(html).toContain('System architecture');
    expect(html).toContain('Agent workflow creation');
  });

  it('shows architect tier includes (5 items)', () => {
    const html = generateSOW(makeMockData({ tier: 'architect' }));
    expect(html).toContain('Advanced system design');
    expect(html).toContain('Multi-agent workflows');
    expect(html).toContain('Full capability transfer');
  });

  it('shows minimum months', () => {
    const html = generateSOW(makeMockData({ min_months: 6 }));
    expect(html).toContain('6 months');
  });

  it('shows project_details when provided', () => {
    const html = generateSOW(makeMockData({ project_details: 'Custom chatbot for customer support' }));
    expect(html).toContain('Custom chatbot for customer support');
    expect(html).toContain('Project-Specific Deliverables');
  });

  it('omits project_details section when not provided', () => {
    const html = generateSOW(makeMockData({ project_details: undefined }));
    expect(html).not.toContain('Project-Specific Deliverables');
  });
});
