"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSession } from "@/features/auth/hooks/use-auth";
import * as vaultApi from "@/features/vault/api/vault.api";
import type { ChatSession, SaveKundaliBody, SavedKundali } from "@/features/vault/types";
import type { ApiError } from "@/lib/api/errors";
import { trackEvent } from "@/providers/posthog-provider";

/**
 * The saved-kundali list is server state, so it lives here and not in a store.
 * It previously sat in `useState` inside the auth context, which meant every
 * caller that added a kundali had to remember to update that array by hand —
 * the exact hand-written cache invalidation rule 6 exists to avoid.
 */
export const vaultKeys = {
  kundalis: ["vault", "kundalis"] as const,
  sessions: ["vault", "sessions"] as const,
};

export function useSavedKundalis() {
  const { isSignedIn } = useSession();
  return useQuery<SavedKundali[], ApiError>({
    queryKey: vaultKeys.kundalis,
    queryFn: vaultApi.listKundalis,
    enabled: isSignedIn,
    // `placeholderData`, not `initialData`: an empty array written into the
    // cache counts as real data, and with the client's 5-minute staleTime it
    // stays fresh — so a first render that happens before the persisted session
    // rehydrates (`isSignedIn` still false) would pin the vault to empty for
    // five minutes. Placeholder data is shown without ever being cached.
    placeholderData: [],
  });
}

/**
 * Removing a chart. The list is invalidated rather than spliced by hand — the
 * server decides what the vault contains, and a local splice is a second copy
 * of that answer waiting to disagree with it.
 */
export function useDeleteKundali() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: vaultApi.deleteKundali,
    onSuccess: () => {
      trackEvent("kundali_deleted_from_vault");
      queryClient.invalidateQueries({ queryKey: vaultKeys.kundalis });
    },
  });
}

/**
 * Saved conversations. The list endpoint returns sessions without their
 * messages by design — loading every message body for every session made it
 * one query per session — so this is a count and a title list, not a
 * transcript.
 */
export function useChatSessions() {
  const { isSignedIn } = useSession();
  return useQuery<ChatSession[], ApiError>({
    queryKey: vaultKeys.sessions,
    queryFn: vaultApi.listSessions,
    enabled: isSignedIn,
    placeholderData: [],
  });
}

export function useSaveKundali() {
  const queryClient = useQueryClient();
  return useMutation<SavedKundali, ApiError, SaveKundaliBody>({
    mutationFn: vaultApi.saveKundali,
    onSuccess: () => {
      trackEvent("kundali_saved_to_vault");
      queryClient.invalidateQueries({ queryKey: vaultKeys.kundalis });
    },
  });
}
