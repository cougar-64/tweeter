// AI-assisted: see AI-ATTRIBUTION.md
import { randomUUID } from "node:crypto";
import { setTimeout as pause } from "node:timers/promises";
import { readFile } from "node:fs/promises";
import { deepStrictEqual } from "node:assert";
import { AuthToken, LoginRequest, RegisterRequest, User } from "tweeter-shared";
import { buildMilestone4Fixtures, fixtureImageBase64 } from "../../../../tweeter-server/src/tools/milestone4Fixtures";
import { ServerFacade } from "../../../src/net/ServerFacade";

/** No implicit API target or embedded credentials for persisted live tests. */
export async function loadLiveTestContext() {
  const required = (name: string): string => {
    const value = process.env[name];
    if (!value) throw new Error(`Set ${name} before running persisted integration tests; see README Milestone 4 fixtures.`);
    return value;
  };
  const baseUrl = required("TWEETER_API_BASE_URL").replace(/\/$/, "");
  const password = required("TWEETER_TEST_PASSWORD");
  const parsed = JSON.parse(await readFile(required("TWEETER_FIXTURE_PATH"), "utf8"));
  const fixtures = buildMilestone4Fixtures(parsed.namespace, parsed.imageUrl);
  deepStrictEqual(parsed, fixtures, "Fixture manifest differs from this fixture version. Use a fresh seed namespace.");
  const facade = new ServerFacade(baseUrl);
  const tokens = new Set<string>();
  const track = (result: [User, AuthToken]): [User, AuthToken] => {
    tokens.add(result[1].token);
    return result;
  };
  const logout = async (token: AuthToken): Promise<void> => {
    await facade.logout({ token: token.token });
    tokens.delete(token.token);
  };
  return {
    baseUrl, password, fixtures, facade, track, logout,
    forgetRevoked: (token: AuthToken) => { tokens.delete(token.token); },
    login: async (role: keyof typeof fixtures.users = "reader") =>
      track(await facade.login(new LoginRequest(fixtures.users[role].alias, password))),
    cleanup: async () => {
      for (const token of tokens) {
        await facade.logout({ token });
        tokens.delete(token);
      }
    },
  };
}

export type LiveTestContext = Awaited<ReturnType<typeof loadLiveTestContext>>;

export function postLive(context: LiveTestContext, path: string, body: unknown): Promise<Response> {
  return fetch(`${context.baseUrl}${path}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
}

export async function expectLiveError(context: LiveTestContext, path: string, body: unknown, status: number, message: string): Promise<void> {
  const response = await postLive(context, path, body);
  expect(response.status).toBe(status);
  expect(response.headers.get("access-control-allow-origin")).toBe("*");
  await expect(response.json()).resolves.toEqual({ errorMessage: message });
}

export async function expectLivePreflight(context: LiveTestContext, path: string): Promise<void> {
  const response = await fetch(`${context.baseUrl}${path}`, {
    method: "OPTIONS", headers: { Origin: "http://localhost:5173", "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type" },
    signal: AbortSignal.timeout(10000),
  });
  expect(response.status).toBe(200);
  expect(response.headers.get("access-control-allow-origin")).toBe("*");
  expect(response.headers.get("access-control-allow-methods")).toContain("POST");
  expect(response.headers.get("access-control-allow-headers")?.toLowerCase()).toContain("content-type");
  await response.text();
}

/** Mutation suites get their own accounts instead of modifying seed snapshots. */
export async function registerLiveUser(context: LiveTestContext, label: string): Promise<[User, AuthToken]> {
  return context.track(await context.facade.register(new RegisterRequest(
    label, "Integration", `@live-${randomUUID()}`, context.password, fixtureImageBase64, "png"
  )));
}

/** Retry only successful reads whose eventually consistent data has not converged. */
export async function waitForLive<T>(read: () => Promise<T>, ready: (value: T) => boolean): Promise<T> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const value = await read();
    if (ready(value)) return value;
    if (attempt < 11) await pause(250);
  }
  throw new Error("Live follower index did not converge after 12 reads.");
}
