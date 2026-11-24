// AI-assisted: see AI-ATTRIBUTION.md
import { randomUUID } from "node:crypto";
import { AuthToken, FollowingStatusRequest, User, UserAliasRequest } from "tweeter-shared";
import { FollowService } from "../../../src/model.service/FollowService";
import { expectLiveError, expectLivePreflight, loadLiveTestContext, registerLiveUser, type LiveTestContext } from "./liveTestContext";

export function describeRelationshipMutation(action: "follow" | "unfollow"): void {
  describe(`Persisted ${action} integration`, () => {
    let context: LiveTestContext;
    let actor: User;
    let target: User;
    let token: AuthToken;
    beforeAll(async () => {
      context = await loadLiveTestContext();
      [actor, token] = await registerLiveUser(context, "Actor");
      [target] = await registerLiveUser(context, "Target");
    });
    afterAll(async () => {
      try { if (target && token) await context.facade.unfollow(new UserAliasRequest(token.token, target.alias)); }
      finally { await context?.cleanup(); }
    });

    it.each(["facade", "service"] as const)("persists the relationship and exact counters through the %s, including repeated requests", async (client) => {
      const request = new UserAliasRequest(token.token, target.alias);
      await context.facade[action === "follow" ? "unfollow" : "follow"](request);
      const perform = () => client === "facade" ? context.facade[action](request) : new FollowService(context.facade)[action](token, target);
      await perform(); await perform();
      const count = action === "follow" ? 1 : 0;
      await expect(context.facade.getIsFollowerStatus(new FollowingStatusRequest(token.token, actor.alias, target.alias))).resolves.toBe(action === "follow");
      await expect(context.facade.getFolloweeCount(new UserAliasRequest(token.token, actor.alias))).resolves.toBe(count);
      await expect(context.facade.getFollowerCount(new UserAliasRequest(token.token, target.alias))).resolves.toBe(count);
      await expect(context.facade.getFollowerCount(new UserAliasRequest(token.token, actor.alias))).resolves.toBe(0);
      await expect(context.facade.getFolloweeCount(new UserAliasRequest(token.token, target.alias))).resolves.toBe(0);
    });

    it.each(["alias", "token", "self", "missing"] as const)("returns 400 with CORS for %s", async (field) => {
      const alias = field === "alias" ? "" : field === "self" ? actor.alias : field === "missing" ? `@missing-${randomUUID()}` : target.alias;
      const message = field === "alias" ? "[Bad Request] A user alias is required." : field === "token" ? "[Bad Request] A token is required."
        : field === "self" ? "[Bad Request] Users cannot follow themselves." : "[Bad Request] User not found.";
      await expectLiveError(context, `/${action}`, new UserAliasRequest(field === "token" ? "" : token.token, alias), 400, message);
    });
    it("returns 401 with CORS for an invalid session", async () => {
      await expectLiveError(context, `/${action}`, new UserAliasRequest("invalid-token", target.alias), 401, "[Unauthorized] Invalid or expired authentication token.");
    });
    it("allows browser preflight", async () => { await expectLivePreflight(context, `/${action}`); });
  });
}
