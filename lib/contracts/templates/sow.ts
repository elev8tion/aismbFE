import { ContractData } from '../types';
import { letterhead, contractFooter, signatureBlock } from './shared';

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
}

function getTierIncludes(tier: string): string[] {
  switch (tier) {
    case 'discovery':
      return [
        'Foundational AI training',
        'Workflow identification',
        'Guided system setup',
        'Capability transfer sessions',
      ];
    case 'foundation':
      return [
        'System architecture',
        'Agent workflow creation',
        'Deeper training',
        'Implementation guidance',
      ];
    case 'architect':
      return [
        'Advanced system design',
        'Multi-agent workflows',
        'Integration planning',
        'High-level advisory',
        'Full capability transfer',
      ];
    default:
      return [];
  }
}

export function generateSOW(data: ContractData, signatures?: Parameters<typeof signatureBlock>[0]): string {
  const includes = getTierIncludes(data.tier);

  return `
    <div class="contract">
      ${letterhead()}

      <h1>Statement of Work</h1>
      <p>Effective Date: ${data.effective_date}</p>

      <p>This Statement of Work ("SOW") is entered into under the Master Services Agreement between ELEV8TION LLC ("ELEV8TION") and <strong>${data.company_name}</strong> ("Client").</p>

      <hr class="section-divider" />

      <h2>1. Project Overview</h2>
      <p>ELEV8TION will provide consulting, training, and intelligent systems architecture services to support Client's development and implementation of AI-enabled systems and workflows.</p>

      <hr class="section-divider" />

      <h2>2. Scope of Services</h2>
      <p>ELEV8TION will provide the following services:</p>
      <ul>
        <li>AI system design and planning</li>
        <li>Workflow architecture</li>
        <li>Agent and automation configuration</li>
        <li>Capability transfer and training</li>
        <li>Implementation guidance</li>
        <li>Advisory support</li>
      </ul>
      ${data.project_details ? `
        <div class="highlight">
          <p><strong>Project-Specific Deliverables:</strong></p>
          <p>${data.project_details}</p>
        </div>
      ` : ''}
      <p>Any work outside this scope requires a written amendment.</p>

      <hr class="section-divider" />

      <h2>3. Deliverables</h2>
      <p>ELEV8TION will provide:</p>
      <ul>
        <li>System architecture guidance</li>
        <li>Configured workflows</li>
        <li>Training sessions</li>
        <li>Documentation (if applicable)</li>
      </ul>

      <hr class="section-divider" />

      <h2>4. Timeline</h2>
      <p>Start Date: ${data.effective_date}</p>
      <p>Minimum Engagement: ${data.min_months} months</p>
      <p>Timelines depend on Client responsiveness and access. Delays in feedback or access may extend timeline.</p>

      <hr class="section-divider" />

      <h2>5. Fees</h2>
      <table class="fee-table">
        <tr>
          <th>Item</th>
          <th>Amount</th>
        </tr>
        <tr>
          <td>Setup / Capability Transfer Fee</td>
          <td><strong>${formatCents(data.fees.setup_cents)}</strong></td>
        </tr>
        <tr>
          <td>Monthly Partnership Fee</td>
          <td><strong>${formatCents(data.fees.monthly_cents)}/month</strong></td>
        </tr>
        <tr>
          <td>Minimum Engagement Term</td>
          <td>${data.min_months} months</td>
        </tr>
        <tr>
          <td>Total Minimum Investment</td>
          <td><strong>${formatCents(data.fees.setup_cents + (data.fees.monthly_cents * data.min_months))}</strong></td>
        </tr>
      </table>
      <p>All completed work and deposits are non-refundable. If Client terminates early, future unpaid installments are canceled but completed phases remain due.</p>

      <hr class="section-divider" />

      <h2>6. Client Responsibilities</h2>
      <p>Client agrees to:</p>
      <ul>
        <li>Provide timely feedback</li>
        <li>Attend training sessions</li>
        <li>Review outputs</li>
        <li>Supervise system use</li>
        <li>Approve automation deployment</li>
      </ul>

      <hr class="section-divider" />

      <h2>7. Access &amp; Tools</h2>
      <p>Client may provide system access or API keys for implementation purposes.</p>
      <p>Client remains responsible for credential security, permission scope, and key rotation.</p>

      <hr class="section-divider" />

      <h2>8. Acceptance</h2>
      <p>Services are considered accepted upon delivery of training, systems, or documentation as defined above.</p>

      <hr class="section-divider" />

      <h2>9. Governing Agreement</h2>
      <p>This SOW is governed by the Master Services Agreement and all attached addenda.</p>

      <hr class="section-divider" />

      <h2>Monthly Partnership Terms</h2>
      <p>Client engages ELEV8TION for ongoing advisory, training, and system support.</p>
      <p>Monthly services may include:</p>
      <ul>
        <li>Strategy sessions</li>
        <li>System reviews</li>
        <li>Architecture guidance</li>
        <li>Troubleshooting</li>
        <li>Optimization recommendations</li>
      </ul>
      <p>Monthly services do not include full system builds unless specified.</p>

      <h3>Minimum Term</h3>
      <p>Client agrees to a minimum engagement term of <strong>${data.min_months} months</strong> for the <strong>${data.tierName}</strong> tier.</p>
      <p>After minimum term, either party may cancel with written notice.</p>

      <hr class="section-divider" />

      <h2>${data.tierName} Capability Transfer</h2>
      <div class="highlight">
        <p><strong>One-time Fee:</strong> ${formatCents(data.fees.setup_cents)}</p>
        <p><strong>Monthly Fee:</strong> ${formatCents(data.fees.monthly_cents)}</p>
        <p><strong>Minimum:</strong> ${data.min_months} months</p>
      </div>
      <p><strong>Includes:</strong></p>
      <ul>
        ${includes.map(item => `<li>${item}</li>`).join('\n        ')}
      </ul>

      ${signatureBlock(signatures || {
        clientName: data.client_name,
        clientTitle: data.client_title,
        clientCompany: data.company_name,
      })}

      ${contractFooter()}
    </div>
  `;
}
