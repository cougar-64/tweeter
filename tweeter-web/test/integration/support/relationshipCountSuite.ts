// AI-assisted: see AI-ATTRIBUTION.md
import { randomUUID } from "node:crypto";
import { AuthToken, User, UserAliasRequest } from "tweeter-shared";
import { FollowService } from "../../../src/model.service/FollowService";
import { expectLiveError, expectLivePreflight, loadLiveTestContext, type LiveTestContext } from "./liveTestContext";

export function describeRelationshipCount(direction: "followers" | "followees"): void {
  describe(`Persisted ${direction} count integration`, () => {
    let context: LiveTestContext;
    let token: AuthToken;
    const method = direction === "followers" ? "getFollowerCount" : "getFolloweeCount";
    beforeAll(async () => { context = await loadLiveTestContext(); [, token] = await context.login(); });
    afterAll(async () => { await context?.cleanup(); });
    it.each(["facade", "service"] as const)("returns exact persisted counts including zeros through the %s", async (client) => {
      for (const role of ["reader", "authorA", "empty"] as const) {
        const user = User.fromDto(context.fixtures.users[role]);
        const expected = direction === "followers" ? (role === "authorA" ? 1 : 0) : (role === "reader" ? 2 : 0);
        const count = client === "facade" ? await context.facade[method](new UserAliasRequest(token.token, user.alias))
          : await new FollowService(context.facade)[method](token, user);
        expect(count).toBe(expected);
      }
    });
    it.each(["alias", "token", "missing"] as const)("returns 400 with CORS for %s", async (field) => {
      const alias = field === "alias" ? "" : field === "missing" ? `@missing-${randomUUID()}` : context.fixtures.users.reader.alias;
      await expectLiveError(context, `/${direction}/count`, new UserAliasRequest(field === "token" ? "" : token.token, alias), 400,
        field === "alias" ? "[Bad Request] A user alias is required." : field === "token" ? "[Bad Request] A token is required." : "[Bad Request] User not found.");
    });
    it("returns 401 with CORS for an invalid session", async () => {
      await expectLiveError(context, `/${direction}/count`, new UserAliasRequest("invalid-token", context.fixtures.users.reader.alias), 401,
        "[Unauthorized] Invalid or expired authentication token.");
    });
    it("allows browser preflight", async () => { await expectLivePreflight(context, `/${direction}/count`); });
  });
}
