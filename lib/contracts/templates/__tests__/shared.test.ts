import { describe, it, expect } from 'vitest';
import { contractCSS, letterhead, contractFooter, signatureBlock } from '../shared';

describe('contractCSS', () => {
  it('is a non-empty string', () => {
    expect(contractCSS.length).toBeGreaterThan(0);
  });

  it('contains body styling', () => {
    expect(contractCSS).toContain('body');
  });

  it('contains signature-block styling', () => {
    expect(contractCSS).toContain('.signature-block');
  });
});

describe('letterhead', () => {
  it('contains company name', () => {
    expect(letterhead()).toContain('ELEV8TION LLC');
  });

  it('contains location', () => {
    expect(letterhead()).toContain('Waterbury, Connecticut');
  });

  it('contains email', () => {
    expect(letterhead()).toContain('connect@elev8tion.one');
  });
});

describe('contractFooter', () => {
  it('contains company name', () => {
    expect(contractFooter()).toContain('ELEV8TION LLC');
  });

  it('contains agreement text', () => {
    expect(contractFooter()).toContain('part of the agreement');
  });
});

describe('signatureBlock', () => {
  it('renders blank lines when no data provided', () => {
    const html = signatureBlock({});
    expect(html).toContain('_______________');
    expect(html).toContain('Signatures');
    expect(html).toContain('Authorized Signature');
  });

  it('renders admin name when provided', () => {
    const html = signatureBlock({ adminName: 'KC' });
    expect(html).toContain('Name: KC');
  });

  it('renders admin title when provided', () => {
    const html = signatureBlock({ adminTitle: 'CEO' });
    expect(html).toContain('Title: CEO');
  });

  it('renders admin signature image when provided', () => {
    const html = signatureBlock({ adminSignature: 'data:image/png;base64,abc' });
    expect(html).toContain('img src="data:image/png;base64,abc"');
    expect(html).toContain('Admin signature');
  });

  it('renders client details when provided', () => {
    const html = signatureBlock({
      clientName: 'John Doe',
      clientTitle: 'CTO',
      clientCompany: 'Acme Inc',
      clientSignedAt: '2026-02-07',
    });
    expect(html).toContain('Name: John Doe');
    expect(html).toContain('Title: CTO');
    expect(html).toContain('Acme Inc');
    expect(html).toContain('Date: 2026-02-07');
  });

  it('renders client signature image when provided', () => {
    const html = signatureBlock({ clientSignature: 'data:image/png;base64,xyz' });
    expect(html).toContain('img src="data:image/png;base64,xyz"');
    expect(html).toContain('Client signature');
  });
});
