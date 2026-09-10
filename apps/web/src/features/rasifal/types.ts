import type { components } from "@/lib/api/generated/schema";

export type Rasifal = components["schemas"]["RasifalOut"];
export type RashiDay = components["schemas"]["RashiDayOut"];
export type RashiTransit = components["schemas"]["TransitOut"];

export type PeriodRasifal = components["schemas"]["PeriodRasifalOut"];
export type RashiPeriod = components["schemas"]["RashiPeriodOut"];
export type Span = "daily" | "weekly" | "monthly";
