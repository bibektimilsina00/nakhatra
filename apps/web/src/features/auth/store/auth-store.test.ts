import { beforeEach, describe, expect, it } from "vitest";
import { authHeaders, useAuthStore } from "./auth-store";

const USER = {
  id: "usr_1",
  email: "a@b.c",
  full_name: "A B",
  created_at: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  useAuthStore.setState({
    token: null,
    user: null,
  });
});

describe("auth store", () => {
  it("starting a session stores token and user", () => {
    useAuthStore.getState().setSession("t0ken", USER);
    expect(useAuthStore.getState().token).toBe("t0ken");
    expect(useAuthStore.getState().user).toEqual(USER);
  });

  it("clearing a session drops both token and user", () => {
    useAuthStore.getState().setSession("t0ken", USER);
    useAuthStore.getState().clearSession();
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("omits the Authorization header entirely when signed out", () => {
    // `{Authorization: "Bearer null"}` would be sent as a real header and read
    // as a malformed token rather than as an anonymous request.
    expect(authHeaders()).toEqual({});
  });

  it("builds a bearer header when signed in", () => {
    useAuthStore.getState().setSession("t0ken", USER);
    expect(authHeaders()).toEqual({ Authorization: "Bearer t0ken" });
  });
});
