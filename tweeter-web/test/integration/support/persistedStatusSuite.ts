// AI-assisted: see AI-ATTRIBUTION.md
import { AuthToken, PagedStatusItemRequest, Status, Type, User } from "tweeter-shared";
import type { Milestone4Fixtures } from "../../../../tweeter-server/src/tools/milestone4Fixtures";
import { StatusService } from "../../../src/model.service/StatusService";
import { ServerFacade } from "../../../src/net/ServerFacade";
import { expectLiveError, expectLivePreflight, loadLiveTestContext, type LiveTestContext } from "./liveTestContext";

/** Live tests require an explicit API and a successfully written seed manifest. */
export function describePersistedStatus(source: "story" | "feed"): void {
  describe(`Persisted ${source} integration`, () => {
    let context: LiveTestContext;
    let fixtures: Milestone4Fixtures;
    let facade: ServerFacade;
    let token: AuthToken | undefined;
    let ownerAlias: string;
    let expected: Milestone4Fixtures["feed"];
    const load = (request: PagedStatusItemRequest): Promise<[Status[], boolean]> =>
      source === "story" ? facade.getMoreStory(request) : facade.getMoreFeed(request);

    beforeAll(async () => {
      context = await loadLiveTestContext();
      fixtures = context.fixtures;
      facade = context.facade;
      const result = await context.login();
      token = result[1];
      expect(result[0].dto).toEqual(fixtures.users.reader);
      ownerAlias = fixtures.users.reader.alias;
      expected = source === "story" ? fixtures.stories.reader : fixtures.feed;
    });
    afterAll(async () => { await context?.cleanup(); });

    it("returns persisted snapshots through the client service with stable IDs and domain objects", async () => {
      const service = new StatusService(facade);
      const [items, hasMore] = source === "story"
        ? await service.loadMoreStoryItems(token!, ownerAlias, 10, null)
        : await service.loadMoreFeedItems(token!, ownerAlias, 10, null);
      expect(items.map((item) => item.dto)).toEqual(expected.slice(0, 10).map((record) => record.status));
      expect(hasMore).toBe(true);
      expect(items.every((item) => item instanceof Status && item.user instanceof User && item.statusId !== undefined)).toBe(true);
      expect(items[0].segments.some((segment) => segment.type === Type.alias)).toBe(true);
      expect(items[0].segments.some((segment) => segment.type === Type.url)).toBe(true);
    });

    it("paginates every seeded entry exactly once, including timestamp ties and the terminal empty page", async () => {
      const all: Status[] = [];
      const sizes: number[] = [];
      let lastItem: Status | null = null;
      let hasMore = true;
      for (let page = 0; page < 5 && hasMore; page++) {
        const result: [Status[], boolean] = await load(new PagedStatusItemRequest(token!.token, ownerAlias, 10,
          lastItem === null ? null : JSON.parse(JSON.stringify(lastItem.dto))));
        const items: Status[] = result[0];
        hasMore = result[1];
        all.push(...items);
        sizes.push(items.length);
        lastItem = items[items.length - 1] ?? lastItem;
      }
      expect(hasMore).toBe(false);
      expect(sizes).toEqual(source === "story" ? [10, 3] : [10, 10, 6]);
      expect(all.map((item) => item.dto)).toEqual(expected.map((record) => record.status));
      expect(new Set(all.map((item) => item.statusId)).size).toBe(expected.length);
      expect(new Set(all.map((item) => item.timestamp)).size).toBeLessThan(all.length);
      expect(new Set(all.map((item) => item.user.alias)).size).toBe(source === "story" ? 1 : 2);
      await expect(load(new PagedStatusItemRequest(token!.token, ownerAlias, 10, lastItem!.dto))).resolves.toEqual([[], false]);
    });

    it("keeps the selected owner's data separate and returns an existing account's empty page", async () => {
      const otherOwner = source === "story" ? fixtures.users.authorB.alias : fixtures.users.authorA.alias;
      const [other] = await load(new PagedStatusItemRequest(token!.token, otherOwner, 20, null));
      expect(other.map((item) => item.dto)).toEqual(source === "story" ? fixtures.stories.authorB.map((record) => record.status) : fixtures.feeds[otherOwner].map((record) => record.status));
      await expect(load(new PagedStatusItemRequest(token!.token, fixtures.users.empty.alias, 10, null))).resolves.toEqual([[], false]);
    });

    it("returns HTTP 401 with CORS for an invalid token", async () => {
      await expectLiveError(context, `/${source}/list`, new PagedStatusItemRequest("invalid-fixture-token", ownerAlias, 10, null),
        401, "[Unauthorized] Invalid or expired authentication token.");
    });

    it.each(["token", "alias", "pageSize", "cursor", "legacyCursor"] as const)("returns HTTP 400 with CORS for invalid %s", async (field) => {
      const request = { token: token!.token, userAlias: ownerAlias, pageSize: 10, lastItem: null as unknown };
      let message: string;
      if (field === "token") { request.token = ""; message = "[Bad Request] A token is required."; }
      else if (field === "alias") { request.userAlias = ""; message = "[Bad Request] A user alias is required."; }
      else if (field === "pageSize") { request.pageSize = 0; message = "[Bad Request] Page size must be a positive integer."; }
      else if (field === "cursor") { request.lastItem = {}; message = "[Bad Request] Last item must be a status DTO or null."; }
      else {
        const { statusId: _id, ...legacy } = expected[0].status;
        request.lastItem = legacy;
        message = source === "story" ? "[Bad Request] A story cursor must identify a persisted status by the requested author."
          : "[Bad Request] A feed cursor must identify a persisted status.";
      }
      await expectLiveError(context, `/${source}/list`, request, 400, message);
    });

    it("allows the browser's POST preflight request", async () => {
      await expectLivePreflight(context, `/${source}/list`);
    });
  });
}
