import { describe, it, expect } from 'vitest';
import { welcomeEmailTemplate, type WelcomeEmailData } from '../templates';

describe('welcomeEmailTemplate', () => {
  const data: WelcomeEmailData = {
    name: 'John Doe',
    company: 'Acme Inc',
    tier: 'discovery',
    tierName: 'AI Discovery',
    monthlyAmount: '$750',
  };

  it('contains Welcome greeting with name', () => {
    const html = welcomeEmailTemplate(data);
    expect(html).toContain('Welcome, John Doe');
  });

  it('contains tier name', () => {
    const html = welcomeEmailTemplate(data);
    expect(html).toContain('AI Discovery');
  });

  it('contains monthly amount', () => {
    const html = welcomeEmailTemplate(data);
    expect(html).toContain('$750/month');
  });

  it('contains company name', () => {
    const html = welcomeEmailTemplate(data);
    expect(html).toContain('Acme Inc');
  });

  it('contains Welcome Aboard badge', () => {
    const html = welcomeEmailTemplate(data);
    expect(html).toContain('Welcome Aboard');
  });

  it('contains What Happens Next section', () => {
    const html = welcomeEmailTemplate(data);
    expect(html).toContain('What Happens Next');
  });

  it('escapes HTML in name', () => {
    const html = welcomeEmailTemplate({ ...data, name: '<script>alert("xss")</script>' });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
