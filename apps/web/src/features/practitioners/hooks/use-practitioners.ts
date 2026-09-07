"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as api from "@/features/practitioners/api/practitioners.api";
import type {
  ApplicationIn,
  RateIn,
  RateOut,
  ApplicationOut,
  ApplicationReview,
  DirectoryOut,
  DirectoryQuery,
  PractitionerDetail,
  ProfileIn,
  ReviewDecision,
} from "@/features/practitioners/types";
import type { ApiError } from "@/lib/api/errors";

/**
 * Server state lives in TanStack Query (CLAUDE.md rule 6). Nothing here is
 * copied into a store — the directory is the server's data, and a second copy
 * would be a second answer to "who is listed".
 */

export function useDirectory(query: DirectoryQuery) {
  return useQuery<DirectoryOut, ApiError>({
    // The whole filter set is the key, so changing one filter refetches and
    // going back to a previous set is served from cache.
    queryKey: ["practitioners", query],
    queryFn: () => api.directory(query),
    // A directory does not change between two keystrokes of a filter.
    staleTime: 60_000,
    placeholderData: (previous) => previous,
  });
}

export function usePractitioner(id: string | null) {
  return useQuery<PractitionerDetail, ApiError>({
    queryKey: ["practitioner", id],
    queryFn: () => api.practitioner(id as string),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

export function useMyApplication(enabled: boolean) {
  return useQuery<ApplicationOut | null, ApiError>({
    queryKey: ["practitioner-application", "me"],
    queryFn: api.myApplication,
    enabled,
    retry: false,
  });
}

export function useApply() {
  const queryClient = useQueryClient();
  return useMutation<ApplicationOut, ApiError, ApplicationIn>({
    mutationFn: api.apply,
    onSuccess: (application) => {
      // Seed the cache rather than refetch: the response *is* the application,
      // and a refetch would show a spinner over data already in hand.
      queryClient.setQueryData(["practitioner-application", "me"], application);
    },
  });
}

export function useMyProfile(enabled: boolean) {
  return useQuery<PractitionerDetail, ApiError>({
    queryKey: ["practitioner-profile", "me"],
    queryFn: api.myProfile,
    enabled,
    retry: false,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation<PractitionerDetail, ApiError, ProfileIn>({
    mutationFn: api.updateProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(["practitioner-profile", "me"], profile);
      // Publishing or unlisting changes who the directory returns.
      queryClient.invalidateQueries({ queryKey: ["practitioners"] });
    },
  });
}

export function useReviewQueue(state: string | undefined, enabled: boolean) {
  return useQuery<ApplicationReview[], ApiError>({
    queryKey: ["practitioner-applications", state ?? "all"],
    queryFn: () => api.reviewQueue(state),
    enabled,
    retry: false,
  });
}

export function useReview() {
  const queryClient = useQueryClient();
  return useMutation<ApplicationReview, ApiError, { id: string; decision: ReviewDecision }>({
    mutationFn: ({ id, decision }) => api.review(id, decision),
    onSuccess: () => {
      // A decision moves the row between queues, so every filtered list is stale.
      queryClient.invalidateQueries({ queryKey: ["practitioner-applications"] });
      queryClient.invalidateQueries({ queryKey: ["practitioners"] });
    },
  });
}

export function useMyRates(enabled: boolean) {
  return useQuery<RateOut[], ApiError>({
    queryKey: ["practitioner-rates", "me"],
    queryFn: api.myRates,
    enabled,
    retry: false,
  });
}

export function useSetRate() {
  const queryClient = useQueryClient();
  return useMutation<RateOut[], ApiError, RateIn>({
    mutationFn: api.setRate,
    onSuccess: (rates) => {
      queryClient.setQueryData(["practitioner-rates", "me"], rates);
      // Pricing a medium changes whether the directory can offer it.
      queryClient.invalidateQueries({ queryKey: ["practitioners"] });
    },
  });
}
