"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  beginConnect,
  disconnectChannel,
  fetchStudioConfig,
  fetchStudioFile,
  fetchStudioSlide,
  fetchStudioStatus,
  publishStudioDay,
  saveStudioSettings,
  startStudioRender,
  type PublishRequest,
  type StudioSettings,
} from "@/features/studio/api/studio-api";

/** The render's progress. Polled while it runs, left alone once it stops. */
export function useStudioStatus(date: string) {
  return useQuery({
    queryKey: ["studio", date],
    queryFn: () => fetchStudioStatus(date),
    refetchInterval: (q) => (q.state.data?.running || q.state.data?.publishing ? 3000 : false),
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

/** Publish everything switched on, or one channel and one part by name. */
export function usePublishDay(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: PublishRequest = {}) => publishStudioDay(date, req),
    onSettled: () => qc.invalidateQueries({ queryKey: ["studio", date] }),
  });
}

export function useStudioConfig() {
  return useQuery({ queryKey: ["studio-config"], queryFn: fetchStudioConfig, staleTime: 30_000 });
}

export function useSaveSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<StudioSettings>) => saveStudioSettings(patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["studio-config"] }),
  });
}

/** Connecting leaves the site for the channel's consent screen; the callback
 *  brings the admin back to this page with a word in the query string. */
export function useChannelConnect(channel: string) {
  const qc = useQueryClient();
  const connect = useMutation({
    mutationFn: () => beginConnect(channel),
    onSuccess: ({ url }) => {
      window.location.assign(url);
    },
  });
  const disconnect = useMutation({
    mutationFn: () => disconnectChannel(channel),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["studio-config"] }),
  });
  return { connect, disconnect };
}

/** One slide, as HTML for a srcdoc iframe. Cached hard: a slide for a date
 *  only changes when the settings do, and saving them invalidates it. */
export function useStudioSlide(date: string, part: "1" | "2", i: number, enabled: boolean) {
  return useQuery({
    queryKey: ["studio-slide", date, part, i],
    queryFn: () => fetchStudioSlide(date, part, i),
    enabled,
    staleTime: 10 * 60_000,
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
