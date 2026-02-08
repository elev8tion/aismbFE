export interface SigningRequestData {
  clientName: string;
  companyName: string;
  signingUrl: string;
}

export function signingRequestTemplate(data: SigningRequestData): string {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f6f9; margin: 0; padding: 20px; }
.card { background: white; border-radius: 12px; padding: 32px; max-width: 600px; margin: 0 auto; border: 1px solid #e8eaf0; }
.btn { display: inline-block; padding: 14px 28px; background: #0EA5E9; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; }
.footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #aaa; }
</style></head><body>
<div class="card">
  <div style="border-bottom: 2px solid #f0f2f5; padding-bottom: 16px; margin-bottom: 20px;">
    <h1 style="margin: 0; font-size: 22px; color: #1a1a2e;">Contract Ready for Review</h1>
    <p style="margin: 4px 0 0; color: #6a6a8a; font-size: 14px;">ELEV8TION LLC</p>
  </div>

  <p style="font-size: 15px; color: #333;">Hi ${data.clientName},</p>

  <p style="font-size: 15px; color: #333;">Your contract documents for <strong>${data.companyName}</strong> are ready for review and electronic signature.</p>

  <p style="font-size: 15px; color: #333;">The package includes:</p>
  <ul style="font-size: 14px; color: #555;">
    <li>Master Services Agreement (MSA)</li>
    <li>Statement of Work (SOW)</li>
    <li>AI &amp; Automation Services Addendum</li>
  </ul>

  <p style="font-size: 15px; color: #333;">Please review all documents carefully before signing.</p>

  <div style="text-align: center; margin: 28px 0;">
    <a href="${data.signingUrl}" class="btn">Review &amp; Sign Documents</a>
  </div>

  <p style="font-size: 13px; color: #888;">This link expires in 7 days. If you have any questions, reply to this email or contact us at connect@elev8tion.one.</p>

  <div class="footer">
    <p>AI KRE8TION Partners &bull; ELEV8TION LLC &bull; Waterbury, Connecticut</p>
  </div>
</div>
</body></html>`;
}
