import type { components, paths } from "@/lib/api/generated/schema";

export type PractitionerCard = components["schemas"]["PractitionerCard"];
export type PractitionerDetail = components["schemas"]["PractitionerDetail"];
export type DirectoryOut = components["schemas"]["DirectoryOut"];
export type ApplicationIn = components["schemas"]["ApplicationIn"];
export type ApplicationOut = components["schemas"]["ApplicationOut"];
export type ApplicationReview = components["schemas"]["ApplicationReviewOut"];
export type ReviewDecision = components["schemas"]["ReviewDecisionIn"];
export type ProfileIn = components["schemas"]["ProfileIn"];

/** The directory's filters, as the endpoint declares them. */
export type DirectoryQuery = NonNullable<
  paths["/v1/practitioners"]["get"]["parameters"]["query"]
>;
export type RateIn = components["schemas"]["RateIn"];
export type RateOut = components["schemas"]["RateOut"];
