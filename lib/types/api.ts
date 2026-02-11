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
