import { describe, it, expect } from 'vitest';
import { getContractBundle } from '../index';
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

describe('getContractBundle', () => {
  it('returns an object with msa, sow, and addendum keys', () => {
    const bundle = getContractBundle(mockData);
    expect(bundle).toHaveProperty('msa');
    expect(bundle).toHaveProperty('sow');
    expect(bundle).toHaveProperty('addendum');
  });

  it('wraps MSA with DOCTYPE html', () => {
    const bundle = getContractBundle(mockData);
    expect(bundle.msa).toMatch(/^<!DOCTYPE html>/);
  });

  it('wraps SOW with DOCTYPE html', () => {
    const bundle = getContractBundle(mockData);
    expect(bundle.sow).toMatch(/^<!DOCTYPE html>/);
  });

  it('wraps addendum with DOCTYPE html', () => {
    const bundle = getContractBundle(mockData);
    expect(bundle.addendum).toMatch(/^<!DOCTYPE html>/);
  });

  it('includes CSS in each document', () => {
    const bundle = getContractBundle(mockData);
    expect(bundle.msa).toContain('<style>');
    expect(bundle.sow).toContain('<style>');
    expect(bundle.addendum).toContain('<style>');
  });
});
