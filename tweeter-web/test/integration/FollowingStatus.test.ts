// AI-assisted: see AI-ATTRIBUTION.md
import { AuthToken, FollowingStatusRequest, User } from "tweeter-shared";
import { FollowService } from "../../src/model.service/FollowService";
import { expectLiveError, expectLivePreflight, loadLiveTestContext, type LiveTestContext } from "./support/liveTestContext";

describe("Persisted following status integration", () => {
  let context: LiveTestContext;
  let token: AuthToken;
  beforeAll(async () => { context = await loadLiveTestContext(); [, token] = await context.login(); });
  afterAll(async () => { await context?.cleanup(); });
  it.each(["facade", "service"] as const)("returns exact directed relationship state through the %s", async (client) => {
    const { reader, authorA, empty } = context.fixtures.users;
    for (const [from, to, expected] of [[reader, authorA, true], [authorA, reader, true], [reader, empty, false], [reader, reader, false]] as const) {
      const result = client === "facade" ? await context.facade.getIsFollowerStatus(new FollowingStatusRequest(token.token, from.alias, to.alias))
        : await new FollowService(context.facade).getIsFollowerStatus(token, User.fromDto(from), User.fromDto(to));
      expect(result).toBe(expected);
    }
  });
  it.each(["follower", "followee", "token"] as const)("returns 400 with CORS for empty %s", async (field) => {
    await expectLiveError(context, "/follow/status", new FollowingStatusRequest(field === "token" ? "" : token.token,
      field === "follower" ? "" : context.fixtures.users.reader.alias, field === "followee" ? "" : context.fixtures.users.authorA.alias), 400,
    field === "token" ? "[Bad Request] A token is required." : `[Bad Request] A ${field} alias is required.`);
  });
  it("returns 401 with CORS for an invalid session", async () => {
    await expectLiveError(context, "/follow/status", new FollowingStatusRequest("invalid-token", context.fixtures.users.reader.alias, context.fixtures.users.authorA.alias),
      401, "[Unauthorized] Invalid or expired authentication token.");
  });
  it("allows browser preflight", async () => { await expectLivePreflight(context, "/follow/status"); });
});
