"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as api from "@/features/consultations/api/consultations.api";
import type {
  Consultation,
  ConsultationMessage,
  ConsultationRequest,
  Grant,
  Wallet,
} from "@/features/consultations/types";
import type { ApiError } from "@/lib/api/errors";

/**
 * How often to poll **when the socket is down**.
 *
 * Updates arrive over a WebSocket (`use-consultation-socket.ts`). This is the
 * fallback: a socket that silently fails is worse than polling, because the
 * screen stops updating with no sign that anything is wrong. When the socket is
 * connected these queries do not poll at all.
 */
const FALLBACK_POLL_MS = 4_000;

export function useMyConsultations() {
  return useQuery<Consultation[], ApiError>({
    queryKey: ["consultations"],
    queryFn: api.mine,
    staleTime: 10_000,
  });
}

export function useConsultation(id: string | null, live: boolean, socketUp = false) {
  return useQuery<Consultation, ApiError>({
    queryKey: ["consultation", id],
    queryFn: () => api.one(id as string),
    enabled: Boolean(id),
    // Only while something can still change, and only while the socket is not
    // carrying those changes itself.
    refetchInterval: live && !socketUp ? FALLBACK_POLL_MS : false,
  });
}

export function useMessages(id: string | null, live: boolean, socketUp = false) {
  return useQuery<ConsultationMessage[], ApiError>({
    queryKey: ["consultation-messages", id],
    queryFn: () => api.messages(id as string),
    enabled: Boolean(id),
    refetchInterval: live && !socketUp ? FALLBACK_POLL_MS : false,
  });
}

export function useSendMessage(id: string) {
  const queryClient = useQueryClient();
  return useMutation<ConsultationMessage, ApiError, string>({
    mutationFn: (body) => api.send(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultation-messages", id] });
    },
  });
}

export function useConsultationAction(id: string) {
  const queryClient = useQueryClient();
  return useMutation<Consultation, ApiError, string>({
    mutationFn: (action) => api.act(id, action),
    onSuccess: (consultation) => {
      queryClient.setQueryData(["consultation", id], consultation);
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
      // Connecting places a hold and ending captures it, so the wallet moved.
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}

export function useRequestConsultation() {
  const queryClient = useQueryClient();
  return useMutation<Consultation, ApiError, ConsultationRequest>({
    mutationFn: api.request,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["consultations"] }),
  });
}

export function useWallet(live = false) {
  return useQuery<Wallet, ApiError>({
    queryKey: ["wallet"],
    queryFn: api.wallet,
    // Refreshed during a session so the held amount and the balance stay
    // truthful while the meter runs.
    refetchInterval: live ? 15_000 : false,
    staleTime: 5_000,
  });
}

export function useGrants() {
  return useQuery<Grant[], ApiError>({ queryKey: ["grants"], queryFn: api.grants });
}

export function useRevokeGrant() {
  const queryClient = useQueryClient();
  return useMutation<Grant, ApiError, string>({
    mutationFn: api.revokeGrant,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["grants"] }),
  });
}
