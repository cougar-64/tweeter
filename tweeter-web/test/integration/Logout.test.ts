// AI-assisted: see AI-ATTRIBUTION.md
import { AuthenticatedRequest, UserAliasRequest } from "tweeter-shared";
import { UserService } from "../../src/model.service/UserService";
import { expectLiveError, expectLivePreflight, loadLiveTestContext, type LiveTestContext } from "./support/liveTestContext";

describe("Persisted logout integration", () => {
  let context: LiveTestContext;
  beforeAll(async () => { context = await loadLiveTestContext(); });
  afterAll(async () => { await context?.cleanup(); });

  it.each(["facade", "service"] as const)("revokes a real session through the %s and blocks reuse", async (client) => {
    const [, token] = await context.login();
    if (client === "facade") await context.logout(token);
    else {
      await new UserService(context.facade).logout(token);
      // Remove the successfully revoked token from afterAll cleanup.
      context.forgetRevoked(token);
    }
    await expectLiveError(context, "/user/get", new UserAliasRequest(token.token, context.fixtures.users.reader.alias),
      401, "[Unauthorized] Invalid or expired authentication token.");
    await expectLiveError(context, "/user/logout", new AuthenticatedRequest(token.token),
      401, "[Unauthorized] Invalid or expired authentication token.");
  });

  it("returns 400 with CORS for an empty token", async () => {
    await expectLiveError(context, "/user/logout", new AuthenticatedRequest(""), 400, "[Bad Request] A token is required.");
  });

  it("allows browser preflight", async () => { await expectLivePreflight(context, "/user/logout"); });
});
