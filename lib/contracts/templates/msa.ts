import { ContractData } from '../types';
import { letterhead, contractFooter, signatureBlock } from './shared';

export function generateMSA(data: ContractData, signatures?: Parameters<typeof signatureBlock>[0]): string {
  return `
    <div class="contract">
      ${letterhead()}

      <h1>Master Services Agreement</h1>
      <p>Effective Date: ${data.effective_date}</p>

      <p>This Master Services Agreement ("Agreement") is entered into between ELEV8TION LLC, a Connecticut limited liability company with a principal place of business in Waterbury, Connecticut ("ELEV8TION"), and <strong>${data.company_name}</strong> ("Client").</p>

      <p>This Agreement governs all services provided by ELEV8TION to Client.</p>

      <hr class="section-divider" />

      <h2>1. Services</h2>
      <p>ELEV8TION provides consulting, training, and intelligent systems architecture services, including but not limited to:</p>
      <ul>
        <li>AI system design and integration</li>
        <li>Agent and automation development</li>
        <li>Capability transfer and technical training</li>
        <li>Workflow and process architecture</li>
        <li>Advisory and strategic consulting</li>
      </ul>
      <p>Specific deliverables, timelines, and fees will be defined in one or more Statements of Work ("SOW").</p>
      <p>ELEV8TION does not provide legal, financial, accounting, or regulatory advice.</p>

      <hr class="section-divider" />

      <h2>2. Independent Contractor</h2>
      <p>ELEV8TION is an independent contractor. Nothing in this Agreement creates a partnership, joint venture, or employment relationship.</p>

      <hr class="section-divider" />

      <h2>3. Client Responsibilities</h2>
      <p>Client agrees to:</p>
      <ul>
        <li>Provide accurate information and timely feedback</li>
        <li>Review all system outputs before use</li>
        <li>Approve any automation prior to production deployment</li>
        <li>Maintain supervision over all deployed systems</li>
        <li>Secure and manage credentials, API keys, and access permissions</li>
      </ul>
      <p>Client is solely responsible for how systems are used after delivery, training, or deployment.</p>

      <hr class="section-divider" />

      <h2>4. AI Systems &amp; Automation Disclaimer</h2>
      <p>Client acknowledges that:</p>
      <ul>
        <li>AI systems may produce inaccurate or unpredictable outputs</li>
        <li>Automated agents may act based on provided instructions</li>
        <li>Third-party models may change behavior over time</li>
      </ul>
      <p>Client agrees that all AI outputs must be reviewed by a human prior to reliance or execution in business operations.</p>
      <p>Once systems or automations are approved for deployment by Client, Client assumes responsibility for monitoring and supervising those systems.</p>
      <p>ELEV8TION shall not be liable for damages arising from:</p>
      <ul>
        <li>AI-generated outputs</li>
        <li>Automated actions taken by deployed systems</li>
        <li>Decisions made based on AI outputs</li>
      </ul>

      <hr class="section-divider" />

      <h2>5. Capability Transfer Model</h2>
      <p>ELEV8TION's services are designed to transfer knowledge and capability to Client.</p>
      <p>Upon completion of training, system delivery, or implementation, Client assumes responsibility for operation, maintenance, and use of systems.</p>
      <p>ELEV8TION is not responsible for outcomes resulting from Client's independent use of delivered systems.</p>
      <p>ELEV8TION offers optional month-to-month Active Monitoring after the minimum term, available to all tiers. Active Monitoring includes system health reviews, agent performance checks, and issue response. Details are defined in the applicable SOW. If Client does not elect Active Monitoring, Client assumes full responsibility for ongoing system operation and maintenance.</p>

      <hr class="section-divider" />

      <h2>6. Third-Party Tools &amp; APIs</h2>
      <p>Services may rely on third-party platforms including AI model providers, APIs, and software tools.</p>
      <p>ELEV8TION is not responsible for:</p>
      <ul>
        <li>Outages</li>
        <li>Pricing changes</li>
        <li>Model behavior changes</li>
        <li>Discontinued services</li>
        <li>Third-party data handling</li>
      </ul>
      <p>Client agrees that use of such tools is subject to the respective provider's terms.</p>
      <p><strong>Bundled Tiers (The Revenue Guard, The Operations Sovereign):</strong> ELEV8TION manages API accounts and infrastructure on Client's behalf. Infrastructure and API costs are included in the monthly fee, subject to usage allowances defined in the SOW. Overages are billed at the rate specified in the SOW.</p>
      <p><strong>Pass-Through Tier (The Enterprise Fortress):</strong> Client holds and manages their own API accounts directly with providers. Client is solely responsible for all API costs, usage, billing, and provider agreements. ELEV8TION is not responsible for Client's API costs.</p>

      <hr class="section-divider" />

      <h2>7. Access &amp; Credentials</h2>
      <p>Client may provide access credentials, API keys, or system permissions solely for purposes of performing services.</p>
      <p>Client remains responsible for:</p>
      <ul>
        <li>Credential security</li>
        <li>Key rotation</li>
        <li>Permission management</li>
      </ul>
      <p>ELEV8TION is not liable for damages resulting from compromised credentials or unauthorized access not caused by ELEV8TION's gross negligence.</p>

      <hr class="section-divider" />

      <h2>8. Fees &amp; Payment</h2>
      <p>Fees will be defined in each SOW.</p>
      <p>Unless otherwise stated:</p>
      <ul>
        <li>Payments are due in advance or as invoiced</li>
        <li>Deposits are non-refundable</li>
        <li>Completed work is non-refundable</li>
        <li>If Client terminates, future unpaid installments are canceled</li>
        <li>Minimum engagement terms remain due</li>
        <li>For Bundled tiers, monthly fee includes a defined usage allowance; interactions above the allowance are billed at $0.08 per interaction</li>
        <li>ELEV8TION will notify Client at 80% of allowance usage and may apply emergency rate limits at 100% to prevent unbudgeted overages</li>
      </ul>
      <p>Late payments may result in suspension of services.</p>

      <hr class="section-divider" />

      <h2>9. Intellectual Property</h2>
      <h3>Client Ownership</h3>
      <p>Client owns final configured systems, workflows, and internal implementations created specifically for Client.</p>
      <h3>ELEV8TION Ownership</h3>
      <p>ELEV8TION retains ownership of:</p>
      <ul>
        <li>Frameworks</li>
        <li>Templates</li>
        <li>Methodologies</li>
        <li>Reusable code</li>
        <li>Training materials</li>
        <li>System architectures</li>
        <li>Proprietary processes</li>
      </ul>
      <p>Nothing in this Agreement transfers ownership of ELEV8TION's underlying intellectual property.</p>
      <p>ELEV8TION may reuse general knowledge, skills, and techniques developed during the engagement.</p>

      <hr class="section-divider" />

      <h2>10. Confidentiality</h2>
      <p>Both parties agree to maintain confidentiality of non-public information shared during the engagement.</p>
      <p>This obligation survives termination.</p>

      <hr class="section-divider" />

      <h2>11. Data Handling</h2>
      <p>ELEV8TION will access Client data only as necessary to perform services.</p>
      <p>ELEV8TION does not sell Client data and does not use Client data to train public AI models.</p>
      <p>Client is responsible for ensuring it has the right to use any data provided.</p>
      <p>Additional data terms may be included in a Data Processing Addendum.</p>

      <hr class="section-divider" />

      <h2>12. No Guarantee of Results</h2>
      <p>Client acknowledges that business outcomes depend on many factors outside ELEV8TION's control.</p>
      <p>Any examples of ROI, savings, or performance improvements are illustrative only and not guaranteed.</p>

      <hr class="section-divider" />

      <h2>13. Limitation of Liability</h2>
      <p>To the maximum extent permitted by law:</p>
      <p>ELEV8TION's total liability under this Agreement shall not exceed the total amount paid by Client to ELEV8TION in the three (3) months preceding the claim.</p>
      <p>ELEV8TION shall not be liable for:</p>
      <ul>
        <li>Lost profits</li>
        <li>Business interruption</li>
        <li>Indirect or consequential damages</li>
        <li>Data loss</li>
        <li>Automation outcomes</li>
      </ul>

      <hr class="section-divider" />

      <h2>14. Indemnification</h2>
      <p>Client agrees to indemnify and hold harmless ELEV8TION from claims arising from:</p>
      <ul>
        <li>Client's use of systems</li>
        <li>Deployment of automation</li>
        <li>Misuse of AI outputs</li>
        <li>Violation of third-party terms</li>
      </ul>

      <hr class="section-divider" />

      <h2>15. Term &amp; Termination</h2>
      <p>This Agreement remains in effect until terminated by either party.</p>
      <p>Either party may terminate with written notice.</p>
      <p>Client remains responsible for payment of:</p>
      <ul>
        <li>Completed work</li>
        <li>Work in progress</li>
        <li>Minimum engagement commitments</li>
      </ul>
      <p>No refunds will be issued for completed phases.</p>

      <hr class="section-divider" />

      <h2>16. Dispute Resolution</h2>
      <p>Any dispute shall first be resolved through binding arbitration in Connecticut.</p>
      <p>If arbitration cannot be enforced, disputes shall be resolved in the state courts of Connecticut.</p>
      <p>Each party is responsible for its own legal fees.</p>

      <hr class="section-divider" />

      <h2>17. Governing Law</h2>
      <p>This Agreement is governed by the laws of the State of Connecticut.</p>

      <hr class="section-divider" />

      <h2>18. Entire Agreement</h2>
      <p>This Agreement, together with any SOW and addenda, constitutes the entire agreement between the parties.</p>

      ${signatureBlock(signatures || {
        clientName: data.client_name,
        clientTitle: data.client_title,
        clientCompany: data.company_name,
      })}

      ${contractFooter()}
    </div>
  `;
}
