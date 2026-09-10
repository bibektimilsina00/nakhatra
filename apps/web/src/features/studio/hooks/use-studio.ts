"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchStudioFile,
  fetchStudioStatus,
  startStudioRender,
} from "@/features/studio/api/studio-api";

/** The render's progress. Polled while it runs, left alone once it stops. */
export function useStudioStatus(date: string) {
  return useQuery({
    queryKey: ["studio", date],
    queryFn: () => fetchStudioStatus(date),
    refetchInterval: (q) => (q.state.data?.running ? 3000 : false),
    staleTime: 0,
  });
}

export function useStartRender(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => startStudioRender(date),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["studio", date] }),
  });
}

/** One rendered file, as an object URL the page can play or download. */
export function useStudioFile(date: string, name: string, enabled: boolean) {
  return useQuery({
    queryKey: ["studio-file", date, name],
    queryFn: async () => URL.createObjectURL(await fetchStudioFile(date, name)),
    enabled,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
  });
}

/** Captions are small and wanted as text, not as a download. */
export function useStudioCaption(date: string, name: string, enabled: boolean) {
  return useQuery({
    queryKey: ["studio-caption", date, name],
    queryFn: async () => (await fetchStudioFile(date, name)).text(),
    enabled,
    staleTime: Infinity,
  });
}
