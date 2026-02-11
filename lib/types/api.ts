/**
 * Shared API response types for NocodeBackend and internal endpoints.
 */

/** NCB list endpoint response — always returns { data: T[] } */
export interface NCBListResponse<T = Record<string, unknown>> {
  data: T[];
}

/** NCB single record response — returns { data: T } */
export interface NCBSingleResponse<T = Record<string, unknown>> {
  data: T;
}

/** Standard error/success response from mutation endpoints */
export interface ApiErrorResponse {
  error?: string;
  message?: string;
}

/** Stripe checkout session creation response */
export interface CheckoutSessionResponse {
  url?: string;
  error?: string;
}

/** Contract creation response */
export interface ContractCreateResponse {
  signing_token: string;
}

/** Auth session response */
export interface AuthSessionResponse {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string;
  } | null;
  token?: string;
}

/** Portal API response shape for NCB list reads */
export interface PortalBookingsResponse {
  data: Array<{
    id: number;
    guest_name: string;
    guest_email: string;
    booking_date: string;
    start_time: string;
    end_time: string;
    status: string;
    notes?: string;
  }>;
}

export interface PortalContractsStatusResponse {
  documents: Array<{
    id: number;
    partnership_id: number;
    document_type: string;
    status: string;
  }>;
  signatures: Array<{
    id: number;
    document_id: number;
    signer_type: string;
    signed_at?: string;
  }>;
}
