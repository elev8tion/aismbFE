import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  sendViaEmailIt,
  sendWelcomeEmail,
  sendSigningRequest,
  sendContractSignedNotification,
} from '../sendEmail';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubEnv('EMAILIT_API_KEY', '');
  vi.stubEnv('ADMIN_EMAIL', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('sendViaEmailIt', () => {
  it('calls fetch with correct URL and headers', async () => {
    mockFetch.mockResolvedValue({ ok: true });

    await sendViaEmailIt({
      apiKey: 'test-key',
      to: 'user@test.com',
      subject: 'Test',
      html: '<p>Hello</p>',
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.emailit.com/v1/emails');
    expect(options.method).toBe('POST');
    expect(options.headers['Authorization']).toBe('Bearer test-key');
    expect(options.headers['Content-Type']).toBe('application/json');
  });

  it('includes correct body fields', async () => {
    mockFetch.mockResolvedValue({ ok: true });

    await sendViaEmailIt({
      apiKey: 'test-key',
      to: 'user@test.com',
      subject: 'Test Subject',
      html: '<p>Body</p>',
      tags: ['test'],
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.to).toBe('user@test.com');
    expect(body.subject).toBe('Test Subject');
    expect(body.html).toBe('<p>Body</p>');
    expect(body.tags).toEqual(['test']);
    expect(body.from).toContain('bookings@kre8tion.com');
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve('Bad request'),
    });

    await expect(
      sendViaEmailIt({
        apiKey: 'test-key',
        to: 'user@test.com',
        subject: 'Test',
        html: '<p>Hello</p>',
      })
    ).rejects.toThrow('EmailIt API returned 400');
  });
});

describe('sendSigningRequest', () => {
  it('sends email with signing URL', async () => {
    mockFetch.mockResolvedValue({ ok: true });

    await sendSigningRequest({
      to: 'client@test.com',
      clientName: 'Jane',
      companyName: 'Acme',
      signingUrl: 'https://app.kre8tion.com/sign/token',
      emailitApiKey: 'test-key',
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.to).toBe('client@test.com');
    expect(body.subject).toContain('Acme');
    expect(body.html).toContain('https://app.kre8tion.com/sign/token');
  });

  it('skips when API key missing', async () => {
    await sendSigningRequest({
      to: 'client@test.com',
      clientName: 'Jane',
      companyName: 'Acme',
      signingUrl: 'https://example.com',
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe('sendContractSignedNotification', () => {
  it('sends to admin email', async () => {
    mockFetch.mockResolvedValue({ ok: true });

    await sendContractSignedNotification({
      clientName: 'Jane',
      companyName: 'Acme',
      tier: 'foundation',
      partnershipId: 42,
      emailitApiKey: 'test-key',
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.to).toBe('connect@elev8tion.one'); // default admin email
    expect(body.subject).toContain('Acme');
  });

  it('skips when API key missing', async () => {
    await sendContractSignedNotification({
      clientName: 'Jane',
      companyName: 'Acme',
      tier: 'foundation',
      partnershipId: 42,
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe('sendWelcomeEmail', () => {
  it('sends welcome email with tier name', async () => {
    mockFetch.mockResolvedValue({ ok: true });

    await sendWelcomeEmail({
      to: 'user@test.com',
      name: 'John',
      tier: 'discovery',
      tierName: 'AI Discovery',
      company: 'TestCo',
      monthlyAmount: '$750',
      emailitApiKey: 'test-key',
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.subject).toContain('AI Discovery');
    expect(body.tags).toContain('welcome');
  });

  it('skips when API key missing', async () => {
    await sendWelcomeEmail({
      to: 'user@test.com',
      name: 'John',
      tier: 'discovery',
      tierName: 'AI Discovery',
      company: 'TestCo',
      monthlyAmount: '$750',
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
