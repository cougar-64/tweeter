// AI-assisted: see AI-ATTRIBUTION.md
import { readFile } from "node:fs/promises";
import { deepStrictEqual } from "node:assert";
import { AuthToken, LoginRequest, PagedStatusItemRequest, Status, Type, User } from "tweeter-shared";
import { buildMilestone4Fixtures, type Milestone4Fixtures } from "../../../../tweeter-server/src/tools/milestone4Fixtures";
import { StatusService } from "../../../src/model.service/StatusService";
import { ServerFacade } from "../../../src/net/ServerFacade";

/** Live tests require an explicit API and a successfully written seed manifest. */
export function describePersistedStatus(source: "story" | "feed"): void {
  describe(`Persisted ${source} integration`, () => {
    let fixtures: Milestone4Fixtures;
    let facade: ServerFacade;
    let baseUrl: string;
    let token: AuthToken | undefined;
    let ownerAlias: string;
    let expected: Milestone4Fixtures["feed"];
    const requireEnv = (name: string): string => {
      const value = process.env[name];
      if (!value) throw new Error(`Set ${name} before running persisted status integration tests; see README Milestone 4 fixtures.`);
      return value;
    };
    const load = (request: PagedStatusItemRequest): Promise<[Status[], boolean]> =>
      source === "story" ? facade.getMoreStory(request) : facade.getMoreFeed(request);
    const http = (body: unknown) => fetch(`${baseUrl}/${source}/list`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });

    beforeAll(async () => {
      baseUrl = requireEnv("TWEETER_API_BASE_URL").replace(/\/$/, "");
      const parsed = JSON.parse(await readFile(requireEnv("TWEETER_FIXTURE_PATH"), "utf8"));
      fixtures = buildMilestone4Fixtures(parsed.namespace, parsed.imageUrl);
      deepStrictEqual(parsed, fixtures, "Fixture manifest differs from this fixture version. Use a fresh seed namespace.");
      const result = await new ServerFacade(baseUrl).login(new LoginRequest(fixtures.users.reader.alias, requireEnv("TWEETER_TEST_PASSWORD")));
      facade = new ServerFacade(baseUrl);
      token = result[1];
      expect(result[0].dto).toEqual(fixtures.users.reader);
      ownerAlias = source === "story" ? fixtures.users.authorA.alias : fixtures.users.reader.alias;
      expected = source === "story" ? fixtures.stories.authorA : fixtures.feed;
    });
    afterAll(async () => { if (token) await facade.logout({ token: token.token }); });

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
      expect(other.map((item) => item.dto)).toEqual(source === "story" ? fixtures.stories.authorB.map((record) => record.status) : []);
      await expect(load(new PagedStatusItemRequest(token!.token, fixtures.users.empty.alias, 10, null))).resolves.toEqual([[], false]);
    });

    it("returns HTTP 401 with CORS for an invalid token", async () => {
      const response = await http(new PagedStatusItemRequest("invalid-fixture-token", ownerAlias, 10, null));
      expect(response.status).toBe(401);
      expect(response.headers.get("access-control-allow-origin")).toBe("*");
      await expect(response.json()).resolves.toEqual({ errorMessage: "[Unauthorized] Invalid or expired authentication token." });
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
      const response = await http(request);
      expect(response.status).toBe(400);
      expect(response.headers.get("access-control-allow-origin")).toBe("*");
      await expect(response.json()).resolves.toEqual({ errorMessage: message });
    });

    it("allows the browser's POST preflight request", async () => {
      const response = await fetch(`${baseUrl}/${source}/list`, {
        method: "OPTIONS", headers: { Origin: "http://localhost:5173", "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type" },
        signal: AbortSignal.timeout(10000),
      });
      expect(response.status).toBe(200);
      expect(response.headers.get("access-control-allow-origin")).toBe("*");
      expect(response.headers.get("access-control-allow-methods")).toContain("POST");
      expect(response.headers.get("access-control-allow-headers")?.toLowerCase()).toContain("content-type");
      await response.text();
    });
  });
}
