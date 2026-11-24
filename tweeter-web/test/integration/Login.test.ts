// AI-assisted: see AI-ATTRIBUTION.md
import { randomUUID } from "node:crypto";
import { AuthToken, LoginRequest, User, UserAliasRequest } from "tweeter-shared";
import { UserService } from "../../src/model.service/UserService";
import { expectLiveError, expectLivePreflight, loadLiveTestContext, type LiveTestContext } from "./support/liveTestContext";

describe("Persisted login integration", () => {
  let context: LiveTestContext;
  beforeAll(async () => { context = await loadLiveTestContext(); });
  afterAll(async () => { await context?.cleanup(); });

  it.each(["facade", "service"] as const)("authenticates stored credentials through the %s", async (client) => {
    const profile = context.fixtures.users.reader;
    const [user, token] = client === "facade" ? await context.login()
      : context.track(await new UserService(context.facade).login(profile.alias, context.password));
    expect(user).toBeInstanceOf(User);
    expect(user.dto).toEqual(profile);
    expect(token).toBeInstanceOf(AuthToken);
    expect(token.token).toMatch(/^[a-f0-9]{64}$/);
    expect(token.timestamp).toBeGreaterThan(0);
    expect(AuthToken.fromJson(token.toJson())!.dto).toEqual(token.dto);
    await expect(context.facade.getUser(new UserAliasRequest(token.token, profile.alias))).resolves.toEqual(user);
  });

  it("issues independent tokens on repeated login", async () => {
    const [, first] = await context.login();
    const [, second] = await context.login();
    expect(first.token).not.toBe(second.token);
    await context.logout(first);
    await expect(context.facade.getUser(new UserAliasRequest(second.token, context.fixtures.users.reader.alias)))
      .resolves.toEqual(User.fromDto(context.fixtures.users.reader));
  });

  it.each(["wrong password", "missing alias"] as const)("returns 401 with CORS for %s", async (failure) => {
    const alias = failure === "missing alias" ? `@missing-${randomUUID()}` : context.fixtures.users.reader.alias;
    const password = failure === "wrong password" ? randomUUID() : context.password;
    await expectLiveError(context, "/user/login", new LoginRequest(alias, password), 401, "[Unauthorized] Invalid alias or password.");
  });

  it.each(["alias", "password"] as const)("returns 400 with CORS for an empty %s", async (field) => {
    await expectLiveError(context, "/user/login", new LoginRequest(field === "alias" ? "" : context.fixtures.users.reader.alias,
      field === "password" ? "" : context.password), 400, field === "alias" ? "[Bad Request] An alias is required." : "[Bad Request] A password is required.");
  });

  it("allows browser preflight", async () => { await expectLivePreflight(context, "/user/login"); });
});
