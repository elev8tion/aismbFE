export const contractCSS = `
  body { font-family: 'Georgia', serif; color: #1a1a1a; line-height: 1.7; margin: 0; padding: 0; }
  .contract { max-width: 800px; margin: 0 auto; padding: 40px; }
  h1 { font-size: 22px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px; color: #0a0a0b; }
  h2 { font-size: 16px; margin-top: 28px; margin-bottom: 8px; color: #0a0a0b; border-bottom: 1px solid #e0e0e0; padding-bottom: 4px; }
  h3 { font-size: 14px; margin-top: 16px; margin-bottom: 4px; }
  p { font-size: 13px; margin: 6px 0; }
  ul { font-size: 13px; margin: 6px 0 6px 20px; padding: 0; }
  li { margin-bottom: 3px; }
  .header { border-bottom: 2px solid #0a0a0b; padding-bottom: 16px; margin-bottom: 24px; }
  .header-sub { font-size: 12px; color: #666; margin-top: 2px; }
  .section-divider { border: 0; border-top: 1px solid #e0e0e0; margin: 24px 0; }
  .signature-block { margin-top: 40px; page-break-inside: avoid; }
  .signature-line { border-bottom: 1px solid #333; width: 300px; margin: 24px 0 4px 0; }
  .signature-label { font-size: 12px; color: #666; margin: 2px 0; }
  .signature-img { max-height: 60px; margin-bottom: -10px; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e0e0e0; font-size: 11px; color: #999; }
  .two-col { display: flex; gap: 40px; }
  .two-col > div { flex: 1; }
  .highlight { background: #f8f9fa; padding: 12px 16px; border-left: 3px solid #0EA5E9; margin: 12px 0; }
  .fee-table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
  .fee-table th, .fee-table td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e0e0e0; }
  .fee-table th { background: #f8f9fa; font-weight: 600; }
`;

export function letterhead() {
  return `
    <div class="header">
      <h1>ELEV8TION LLC</h1>
      <p class="header-sub">Waterbury, Connecticut &bull; connect@elev8tion.one</p>
    </div>
  `;
}

export function contractFooter() {
  return `
    <div class="footer">
      <p>ELEV8TION LLC &bull; Waterbury, Connecticut &bull; connect@elev8tion.one</p>
      <p>This document is part of the agreement between ELEV8TION LLC and the Client identified herein.</p>
    </div>
  `;
}

export function signatureBlock(data: {
  adminName?: string;
  adminTitle?: string;
  adminSignature?: string;
  adminSignedAt?: string;
  clientName?: string;
  clientTitle?: string;
  clientCompany?: string;
  clientSignature?: string;
  clientSignedAt?: string;
}) {
  return `
    <div class="signature-block">
      <h2>Signatures</h2>
      <div class="two-col">
        <div>
          <p><strong>ELEV8TION LLC</strong></p>
          <p>Waterbury, Connecticut</p>
          ${data.adminSignature
            ? `<img src="${data.adminSignature}" class="signature-img" alt="Admin signature" />`
            : '<div class="signature-line"></div>'
          }
          <p class="signature-label">Authorized Signature</p>
          <p class="signature-label">Name: ${data.adminName || '_______________'}</p>
          <p class="signature-label">Title: ${data.adminTitle || '_______________'}</p>
          <p class="signature-label">Date: ${data.adminSignedAt || '_______________'}</p>
        </div>
        <div>
          <p><strong>CLIENT</strong></p>
          ${data.clientCompany ? `<p>${data.clientCompany}</p>` : ''}
          ${data.clientSignature
            ? `<img src="${data.clientSignature}" class="signature-img" alt="Client signature" />`
            : '<div class="signature-line"></div>'
          }
          <p class="signature-label">Authorized Signature</p>
          <p class="signature-label">Name: ${data.clientName || '_______________'}</p>
          <p class="signature-label">Title: ${data.clientTitle || '_______________'}</p>
          <p class="signature-label">Date: ${data.clientSignedAt || '_______________'}</p>
        </div>
      </div>
    </div>
  `;
}
