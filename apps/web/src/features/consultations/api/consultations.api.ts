import { authHeaders } from "@/features/auth/store/auth-store";
import type {
  Consultation,
  ConsultationMessage,
  ConsultationRequest,
  Grant,
  Ledger,
  Wallet,
} from "@/features/consultations/types";
import { apiFetch } from "@/lib/api/client";

const auth = () => ({ headers: authHeaders() });

export function request(body: ConsultationRequest): Promise<Consultation> {
  return apiFetch("/v1/consultations", { method: "POST", body, headers: authHeaders() });
}

export function mine(): Promise<Consultation[]> {
  return apiFetch("/v1/consultations", auth());
}

export function one(id: string): Promise<Consultation> {
  return apiFetch(`/v1/consultations/${encodeURIComponent(id)}`, auth());
}

/** accept | decline | cancel | connect | end — all shaped identically. */
export function act(id: string, action: string): Promise<Consultation> {
  return apiFetch(`/v1/consultations/${encodeURIComponent(id)}/${action}`, {
    method: "POST",
    headers: authHeaders(),
  });
}

export function messages(id: string): Promise<ConsultationMessage[]> {
  return apiFetch(`/v1/consultations/${encodeURIComponent(id)}/messages`, auth());
}

export function send(id: string, body: string): Promise<ConsultationMessage> {
  return apiFetch(`/v1/consultations/${encodeURIComponent(id)}/messages`, {
    method: "POST",
    body: { body },
    headers: authHeaders(),
  });
}

export function wallet(): Promise<Wallet> {
  return apiFetch("/v1/wallet", auth());
}

export function ledger(): Promise<Ledger> {
  return apiFetch("/v1/wallet/ledger", auth());
}

export function grants(): Promise<Grant[]> {
  return apiFetch("/v1/grants", auth());
}

export function revokeGrant(id: string): Promise<Grant> {
  return apiFetch(`/v1/grants/${encodeURIComponent(id)}/revoke`, {
    method: "POST",
    headers: authHeaders(),
  });
}
