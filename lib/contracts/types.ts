export type DocumentType = 'msa' | 'sow' | 'addendum';
export type DocumentStatus = 'draft' | 'pending' | 'client_signed' | 'fully_executed';
export type SignerRole = 'client' | 'admin';

export interface DocumentRecord {
  id: number;
  partnership_id: number;
  document_type: DocumentType;
  status: DocumentStatus;
  signing_token: string;
  token_expires_at: string;
  client_name: string;
  client_email: string;
  company_name: string;
  tier: string;
  setup_fee_cents: number;
  monthly_fee_cents: number;
  min_months: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentSignatureRecord {
  id: number;
  document_id: number;
  partnership_id: number;
  signer_role: SignerRole;
  signer_name: string;
  signer_title: string;
  signer_email: string;
  signature_data: string; // base64 PNG
  signed_at: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface ContractData {
  company_name: string;
  client_name: string;
  client_email: string;
  client_title: string;
  tier: string;
  tierName: string;
  fees: {
    setup_cents: number;
    monthly_cents: number;
  };
  min_months: number;
  effective_date: string;
  project_details?: string;
}

export interface SigningCeremonyData {
  token: string;
  documents: DocumentRecord[];
  partnership_id: number;
  company_name: string;
  client_name: string;
  client_email: string;
  tier: string;
  tierName: string;
}
