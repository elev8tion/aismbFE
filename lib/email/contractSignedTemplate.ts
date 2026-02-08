export interface ContractSignedData {
  clientName: string;
  companyName: string;
  tier: string;
  partnershipId: number;
}

export function contractSignedTemplate(data: ContractSignedData): string {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f6f9; margin: 0; padding: 20px; }
.card { background: white; border-radius: 12px; padding: 32px; max-width: 600px; margin: 0 auto; border: 1px solid #e8eaf0; }
.badge { display: inline-block; padding: 4px 16px; border-radius: 20px; background: #F59E0B; color: white; font-size: 13px; font-weight: bold; }
.stat { background: #f8f9fc; padding: 12px; border-radius: 8px; border: 1px solid #e8eaf0; margin-bottom: 8px; }
.label { font-size: 11px; color: #8a8aaa; text-transform: uppercase; font-weight: bold; }
.value { font-size: 16px; font-weight: bold; color: #1a1a2e; }
.footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #aaa; }
</style></head><body>
<div class="card">
  <div style="border-bottom: 2px solid #f0f2f5; padding-bottom: 16px; margin-bottom: 20px;">
    <span class="badge">Action Required</span>
    <h1 style="margin: 8px 0 0; font-size: 20px; color: #1a1a2e;">Client Has Signed Contracts</h1>
  </div>

  <p style="font-size: 15px; color: #333;"><strong>${data.clientName}</strong> from <strong>${data.companyName}</strong> has signed all contract documents.</p>

  <div class="stat"><div class="label">Client</div><div class="value">${data.clientName}</div></div>
  <div class="stat"><div class="label">Company</div><div class="value">${data.companyName}</div></div>
  <div class="stat"><div class="label">Tier</div><div class="value">${data.tier}</div></div>
  <div class="stat"><div class="label">Partnership ID</div><div class="value">#${data.partnershipId}</div></div>

  <p style="margin-top: 20px; font-size: 15px; color: #333;">Please log into the CRM to review and counter-sign the documents to make them fully executed.</p>

  <div class="footer">
    <p>AI KRE8TION Partners CRM</p>
  </div>
</div>
</body></html>`;
}
