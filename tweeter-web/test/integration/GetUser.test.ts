// AI-assisted: see AI-ATTRIBUTION.md
import { randomUUID } from "node:crypto";
import { AuthToken, User, UserAliasRequest } from "tweeter-shared";
import { UserService } from "../../src/model.service/UserService";
import { expectLiveError, expectLivePreflight, loadLiveTestContext, type LiveTestContext } from "./support/liveTestContext";

describe("Persisted user lookup integration", () => {
  let context: LiveTestContext;
  let token: AuthToken;
  beforeAll(async () => { context = await loadLiveTestContext(); [, token] = await context.login(); });
  afterAll(async () => { await context?.cleanup(); });

  it.each(["facade", "service"] as const)("returns only the selected stored public profile through the %s", async (client) => {
    const expected = context.fixtures.users.authorA;
    const user = client === "facade" ? await context.facade.getUser(new UserAliasRequest(token.token, expected.alias))
      : await new UserService(context.facade).getUser(token, expected.alias);
    expect(user).toBeInstanceOf(User);
    expect(user!.dto).toEqual(expected);
    expect(JSON.stringify(user)).not.toMatch(/passwordHash|tokenHash|expiresAt/);
  });

  it("returns null for a nonexistent alias", async () => {
    await expect(context.facade.getUser(new UserAliasRequest(token.token, `@missing-${randomUUID()}`))).resolves.toBeNull();
  });

  it("returns 401 with CORS for an invalid token", async () => {
    await expectLiveError(context, "/user/get", new UserAliasRequest("invalid-token", context.fixtures.users.reader.alias),
      401, "[Unauthorized] Invalid or expired authentication token.");
  });

  it.each(["alias", "token"] as const)("returns 400 with CORS for an empty %s", async (field) => {
    await expectLiveError(context, "/user/get", new UserAliasRequest(field === "token" ? "" : token.token,
      field === "alias" ? "" : context.fixtures.users.reader.alias), 400,
    field === "alias" ? "[Bad Request] A user alias is required." : "[Bad Request] A token is required.");
  });

  it("allows browser preflight", async () => { await expectLivePreflight(context, "/user/get"); });
});
