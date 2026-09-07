import type { components, paths } from "@/lib/api/generated/schema";

export type MilanRequest = components["schemas"]["MilanRequest"];
export type MilanResponse = components["schemas"]["MilanResponse"];
export type Kuta = components["schemas"]["KutaOut"];
export type Manglik = components["schemas"]["ManglikOut"];
export type ManglikCompatibility = components["schemas"]["ManglikCompatibilityOut"];
export type MilanAnalysisRequest = components["schemas"]["MilanAnalysisRequest"];
export type MilanAnalysis = components["schemas"]["MilanAnalysisResponse"];
export type MilanPoint = components["schemas"]["MilanPointOut"];
export type MilanDosha = components["schemas"]["MilanDoshaOut"];
export type MilanRemedy = components["schemas"]["MilanRemedyOut"];

type _Body = paths["/v1/milan/match"]["post"]["requestBody"]["content"]["application/json"];
const _check: _Body extends MilanRequest ? true : never = true;
void _check;
