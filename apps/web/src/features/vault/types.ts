import type { components, paths } from "@/lib/api/generated/schema";

export type SavedKundali = components["schemas"]["SavedKundaliOut"];
export type SaveKundaliBody = components["schemas"]["SavedKundaliIn"];
export type ChatSession = components["schemas"]["ChatSessionOut"];

type _SaveBody =
  paths["/v1/vault/kundalis"]["post"]["requestBody"]["content"]["application/json"];
const _check: _SaveBody extends SaveKundaliBody ? true : never = true;
void _check;
