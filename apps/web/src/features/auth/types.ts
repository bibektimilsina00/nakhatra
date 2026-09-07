/**
 * Feature-facing names for the generated schema.
 *
 * Nothing outside this file imports from `generated/` — regenerating the
 * contract then ripples through one module rather than the whole app.
 */

import type { components, paths } from "@/lib/api/generated/schema";

export type UserProfile = components["schemas"]["UserProfileOut"];
export type TokenResponse = components["schemas"]["TokenResponse"];
export type LoginBody = components["schemas"]["UserLoginIn"];
export type SignupBody = components["schemas"]["UserSignupIn"];
export type GoogleSignInBody = components["schemas"]["GoogleSignInIn"];

// Compile-time proof the request bodies still match the endpoints. A renamed
// field becomes a build failure instead of a runtime 422.
type _LoginBody = paths["/v1/auth/login"]["post"]["requestBody"]["content"]["application/json"];
type _SignupBody = paths["/v1/auth/signup"]["post"]["requestBody"]["content"]["application/json"];
type _GoogleBody = paths["/v1/auth/google"]["post"]["requestBody"]["content"]["application/json"];
const _checkLogin: _LoginBody extends LoginBody ? true : never = true;
const _checkSignup: _SignupBody extends SignupBody ? true : never = true;
const _checkGoogle: _GoogleBody extends GoogleSignInBody ? true : never = true;
void _checkLogin;
void _checkSignup;
void _checkGoogle;
