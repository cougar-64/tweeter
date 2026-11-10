// AI-assisted: see AI-ATTRIBUTION.md
import { AuthToken, PagedStatusItemRequest, Status, Type, User } from "tweeter-shared";
import { StatusService } from "../../src/model.service/StatusService";
import { ServerFacade } from "../../src/net/ServerFacade";

const baseUrl = process.env.TWEETER_API_BASE_URL ??
  "https://s58iqa332m.execute-api.us-east-1.amazonaws.com/dev";
const facade = new ServerFacade(baseUrl);
const token = "milestone-3-test-token";

describe("Story integration", () => {
  it("retrieves the expected story page through the client StatusService", async () => {
    const [items, hasMore] = await new StatusService(facade)
      .loadMoreStoryItems(new AuthToken(token, Date.now()), "@allen", 10, null);

    expect(items).toHaveLength(10);
    expect(hasMore).toBe(true);
    expect(items.every((item) => item instanceof Status && item.user instanceof User)).toBe(true);
    expect(items[0].dto).toEqual({
      post: "Post 0 0\n        My friend @amy likes this website: http://byu.edu. Do you? \n        Or do you prefer this one: http://cs.byu.edu?",
      timestamp: 0,
      user: { firstName: "Allen", lastName: "Anderson", alias: "@allen", imageUrl: "https://faculty.cs.byu.edu/~jwilkerson/cs340/tweeter/images/donald_duck.png" },
    });
    expect(items[0].segments.some((segment) => segment.type === Type.alias && segment.text === "@amy")).toBe(true);
    expect(items[0].segments.some((segment) => segment.type === Type.url && segment.text === "http://byu.edu")).toBe(true);
  });

  it("retrieves all 44 statuses once and stops after the last page through the facade", async () => {
    let lastItem: Status | null = null;
    const all: Status[] = [];
    const sizes: number[] = [];
    let hasMore = true;
    for (let page = 0; page < 6 && hasMore; page++) {
      const request: PagedStatusItemRequest = new PagedStatusItemRequest(token, "@allen", 10, lastItem === null ? null : lastItem.dto);
      const result: [Status[], boolean] = await facade.getMoreStory(request);
      const items: Status[] = result[0];
      hasMore = result[1];
      sizes.push(items.length);
      all.push(...items);
      lastItem = items[items.length - 1] ?? lastItem;
    }
    expect(sizes).toEqual([10, 10, 10, 10, 4]);
    expect(hasMore).toBe(false);
    expect(new Set(all.map((item) => JSON.stringify(item.dto))).size).toBe(44);
    expect(all[43].user.alias).toBe("@kathy");
    expect(all[43].timestamp).toBe(1290000000000);
    await expect(facade.getMoreStory(new PagedStatusItemRequest(token, "@allen", 10, lastItem!.dto)))
      .resolves.toEqual([[], false]);
  });

  it.each([
    ["empty token", new PagedStatusItemRequest("", "@allen", 10, null), "[Bad Request] A token is required."],
    ["empty alias", new PagedStatusItemRequest(token, "", 10, null), "[Bad Request] A user alias is required."],
    ["invalid page size", new PagedStatusItemRequest(token, "@allen", 0, null), "[Bad Request] Page size must be a positive integer."],
    ["malformed cursor", { token, userAlias: "@allen", pageSize: 10, lastItem: {} }, "[Bad Request] Last item must be a status DTO or null."],
  ] as const)("returns HTTP 400 and CORS for %s", async (_description, request, message) => {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/story/list`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request),
      signal: AbortSignal.timeout(10000),
    });
    expect(response.status).toBe(400);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    await expect(response.json()).resolves.toEqual({ errorMessage: message });
  });

  it("allows the browser's POST preflight request", async () => {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/story/list`, {
      method: "OPTIONS",
      headers: { Origin: "http://localhost:5173", "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type" },
      signal: AbortSignal.timeout(10000),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("access-control-allow-methods")).toContain("POST");
    expect(response.headers.get("access-control-allow-headers")?.toLowerCase()).toContain("content-type");
    await response.text();
  });
});
