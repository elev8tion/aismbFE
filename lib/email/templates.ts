/**
 * Email HTML Templates for CRM billing events.
 * Edge-compatible HTML template generators.
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface WelcomeEmailData {
  name: string;
  company: string;
  tier: string;
  tierName: string;
  monthlyAmount: string;
}

export function welcomeEmailTemplate(data: WelcomeEmailData): string {
  const safeName = escapeHtml(data.name);
  const safeCompany = escapeHtml(data.company);
  const safeTierName = escapeHtml(data.tierName);
  const safeMonthly = escapeHtml(data.monthlyAmount);
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to AI KRE8TION Partners</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f9;">
  <table role="presentation" style="width: 100%; border: none; border-spacing: 0; background-color: #f4f6f9;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" class="email-container" style="width: 600px; max-width: 600px; border: none; border-spacing: 0; text-align: left; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 16px; line-height: 1.5; color: #1a1a2e;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px 24px; text-align: center; background-color: #0a0a1a; border-radius: 12px 12px 0 0;">
              <span style="font-size: 28px; font-weight: 700; color: #ffffff;">AI KRE8TION</span>
              <span style="font-size: 28px; font-weight: 300; color: #0066FF;"> Partners</span>
              <br>
              <span style="display: inline-block; margin-top: 16px; background-color: #10B981; color: #ffffff; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; padding: 6px 20px; border-radius: 20px;">Welcome Aboard</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color: #ffffff;">
              <!-- Greeting -->
              <table role="presentation" style="width: 100%; border: none; border-spacing: 0;">
                <tr>
                  <td style="padding: 36px 40px 16px;">
                    <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #1a1a2e;">Welcome, ${safeName}!</h1>
                    <p style="margin: 12px 0 0; font-size: 16px; color: #4a4a6a; line-height: 1.6;">Your setup fee for <strong>${safeCompany}</strong> has been received. Your <strong>${safeTierName}</strong> partnership is now active.</p>
                  </td>
                </tr>
              </table>
              <!-- Partnership Details -->
              <table role="presentation" style="width: 100%; border: none; border-spacing: 0;">
                <tr>
                  <td style="padding: 8px 40px 24px;">
                    <table role="presentation" style="width: 100%; border: none; border-spacing: 0; background-color: #f8f9fc; border-radius: 10px; border: 1px solid #e8eaf0;">
                      <tr>
                        <td style="padding: 24px 28px;">
                          <table role="presentation" style="width: 100%; border: none; border-spacing: 0;">
                            <tr>
                              <td style="padding: 0 0 16px; vertical-align: top;">
                                <span style="font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #8a8aaa;">Partnership Tier</span><br>
                                <span style="font-size: 16px; font-weight: 600; color: #1a1a2e;">${safeTierName}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 0 0 16px; vertical-align: top;">
                                <span style="font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #8a8aaa;">Monthly Partnership Fee</span><br>
                                <span style="font-size: 16px; font-weight: 600; color: #1a1a2e;">${safeMonthly}/month</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 0; vertical-align: top;">
                                <span style="font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #8a8aaa;">Billing</span><br>
                                <span style="font-size: 16px; font-weight: 600; color: #1a1a2e;">Automatic monthly billing has been activated</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Next Steps -->
              <table role="presentation" style="width: 100%; border: none; border-spacing: 0;">
                <tr><td style="padding: 0 40px;"><hr style="border: none; border-top: 1px solid #e8eaf0; margin: 0;"></td></tr>
                <tr>
                  <td style="padding: 28px 40px 36px;">
                    <h2 style="margin: 0 0 16px; font-size: 17px; font-weight: 600; color: #1a1a2e;">What Happens Next</h2>
                    <table role="presentation" style="width: 100%; border: none; border-spacing: 0;">
                      <tr>
                        <td style="padding: 8px 0; font-size: 15px; color: #4a4a6a; line-height: 1.7;">
                          <strong style="color: #0066FF;">1.</strong> Your dedicated consultant will reach out within 24 hours to schedule your kickoff meeting.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 15px; color: #4a4a6a; line-height: 1.7;">
                          <strong style="color: #0066FF;">2.</strong> We will begin the Discovery phase &mdash; mapping your workflows and identifying high-impact AI opportunities.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 15px; color: #4a4a6a; line-height: 1.7;">
                          <strong style="color: #0066FF;">3.</strong> Your first agentic system will be designed, built, and deployed within your partnership timeline.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 28px 40px; text-align: center; background-color: #0a0a1a; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #ffffff;">AI KRE8TION Partners</p>
              <p style="margin: 0 0 16px; font-size: 13px; color: #8a8aaa;">Agentic Systems for Small &amp; Medium Businesses</p>
              <p style="margin: 0; font-size: 12px; color: #6a6a8a;">Questions? Reply to this email and we will get back to you promptly.</p>
              <p style="margin: 16px 0 0; font-size: 11px; color: #4a4a6a;">&copy; ${year} AI KRE8TION Partners. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
