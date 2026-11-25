// AI-assisted: see AI-ATTRIBUTION.md
import { AuthToken, PagedUserItemRequest, User, type UserDto } from "tweeter-shared";
import { relatedFixtureUsers } from "../../../../tweeter-server/src/tools/milestone4Fixtures";
import { FollowService } from "../../../src/model.service/FollowService";
import { expectLiveError, expectLivePreflight, loadLiveTestContext, postLive, waitForLive, type LiveTestContext } from "./liveTestContext";

export function describeRelationshipPage(direction: "followers" | "followees"): void {
  describe(`Persisted ${direction} pagination integration`, () => {
    let context: LiveTestContext;
    let token: AuthToken;
    let owner: string;
    let expected: UserDto[];
    const method = direction === "followers" ? "getMoreFollowers" : "getMoreFollowees";
    const serviceMethod = direction === "followers" ? "loadMoreFollowers" : "loadMoreFollowees";
    const request = (size = 10, lastItem: UserDto | null = null, alias = owner) => new PagedUserItemRequest(token.token, alias, size, lastItem);
    beforeAll(async () => {
      context = await loadLiveTestContext(); [, token] = await context.login();
      const users = context.fixtures.users;
      owner = users.reader.alias;
      expected = relatedFixtureUsers(context.fixtures, owner, direction);
      if (direction === "followers") await waitForLive(() => context.facade[method](request(expected.length + 1)), ([items]) => items.length === expected.length);
    });
    afterAll(async () => { await context?.cleanup(); });

    it("returns exact profiles and 200/CORS through the endpoint", async () => {
      const response = await postLive(context, `/${direction}/list`, request());
      expect(response.status).toBe(200);
      expect(response.headers.get("access-control-allow-origin")).toBe("*");
      await expect(response.json()).resolves.toEqual({ success: true, message: null, items: expected.slice(0, 10), hasMore: expected.length > 10 });
    });
    it("returns every relationship once with JSON cursors and an empty terminal page through the facade", async () => {
      const all: User[] = [];
      let cursor: UserDto | null = null;
      for (let offset = 0; offset < expected.length; offset += 10) {
        const [users, hasMore]: [User[], boolean] = await context.facade[method](request(10, cursor));
        expect(users).toHaveLength(Math.min(10, expected.length - offset));
        expect(users[0]).toBeInstanceOf(User);
        expect(hasMore).toBe(offset + users.length < expected.length);
        all.push(...users);
        cursor = JSON.parse(JSON.stringify(users[users.length - 1].dto));
      }
      expect(all.map((user) => user.dto)).toEqual(expected);
      expect(new Set(all.map((user) => user.alias)).size).toBe(expected.length);
      await expect(context.facade[method](request(10, cursor))).resolves.toEqual([[], false]);
    });
    it("uses the client service and supports empty accounts", async () => {
      const result = await new FollowService(context.facade)[serviceMethod](token, owner, expected.length + 1, null);
      expect(result[0].map((user) => user.dto)).toEqual(expected);
      expect(result[1]).toBe(false);
      await expect(context.facade[method](request(10, null, context.fixtures.users.empty.alias))).resolves.toEqual([[], false]);
    });
    it.each(["token", "pageSize", "cursor"] as const)("returns 400 with CORS for invalid %s", async (field) => {
      await expectLiveError(context, `/${direction}/list`, { ...request(), ...(field === "token" ? { token: "" } : field === "pageSize" ? { pageSize: 0 } : { lastItem: {} }) }, 400,
        field === "token" ? "[Bad Request] A token is required." : field === "pageSize" ? "[Bad Request] Page size must be a positive integer." : "[Bad Request] Last item must be a user DTO or null.");
    });
    it("returns 401 with CORS for an invalid session", async () => {
      await expectLiveError(context, `/${direction}/list`, { ...request(), token: "invalid-token" }, 401, "[Unauthorized] Invalid or expired authentication token.");
    });
    if (direction === "followers") it("preserves CORS on an API Gateway unknown-route error", async () => {
      const response = await fetch(`${context.baseUrl}/followers/list/missing`, {
        headers: { Origin: "http://localhost:5173" }, signal: AbortSignal.timeout(10000),
      });
      expect(response.status).toBe(403);
      expect(response.headers.get("access-control-allow-origin")).toBe("*");
      await response.text();
    });
    it("allows browser preflight", async () => { await expectLivePreflight(context, `/${direction}/list`); });
  });
}
