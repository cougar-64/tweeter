// AI-assisted: see AI-ATTRIBUTION.md
import { AuthToken, PagedStatusItemRequest, Status, Type, User } from "tweeter-shared";
import { StatusService } from "../../src/model.service/StatusService";
import { ServerFacade } from "../../src/net/ServerFacade";

const baseUrl = process.env.TWEETER_API_BASE_URL ??
  "https://s58iqa332m.execute-api.us-east-1.amazonaws.com/dev";
const facade = new ServerFacade(baseUrl);
const token = "milestone-3-test-token";

describe("Feed integration", () => {
  it("retrieves the expected dummy feed through the client StatusService", async () => {
    const [items, hasMore] = await new StatusService(facade)
      .loadMoreFeedItems(new AuthToken(token, Date.now()), "@allen", 10, null);

    expect(items).toHaveLength(10);
    expect(hasMore).toBe(true);
    expect(items.every((item) => item instanceof Status && item.user instanceof User)).toBe(true);
    expect(items[0].dto).toEqual({
      post: "Post 0 0\n        My friend @amy likes this website: http://byu.edu. Do you? \n        Or do you prefer this one: http://cs.byu.edu?",
      timestamp: 0,
      user: { firstName: "Allen", lastName: "Anderson", alias: "@allen", imageUrl: "https://faculty.cs.byu.edu/~jwilkerson/cs340/tweeter/images/donald_duck.png" },
    });
    expect(items[0].segments.some((segment) => segment.type === Type.alias && segment.text === "@amy")).toBe(true);
  });

  it("paginates all 44 statuses through the facade and returns an empty page at the end", async () => {
    const all: Status[] = [];
    const sizes: number[] = [];
    let lastItem: Status | null = null;
    let hasMore = true;
    for (let page = 0; page < 6 && hasMore; page++) {
      const request: PagedStatusItemRequest = new PagedStatusItemRequest(token, "@allen", 10, lastItem === null ? null : lastItem.dto);
      const result: [Status[], boolean] = await facade.getMoreFeed(request);
      const items: Status[] = result[0];
      hasMore = result[1];
      all.push(...items);
      sizes.push(items.length);
      lastItem = items[items.length - 1] ?? lastItem;
    }
    expect(sizes).toEqual([10, 10, 10, 10, 4]);
    expect(hasMore).toBe(false);
    expect(new Set(all.map((item) => JSON.stringify(item.dto))).size).toBe(44);
    expect(all[43].user.alias).toBe("@kathy");
    await expect(facade.getMoreFeed(new PagedStatusItemRequest(token, "@allen", 10, lastItem!.dto)))
      .resolves.toEqual([[], false]);
  });

  it.each([
    ["token", new PagedStatusItemRequest("", "@allen", 10, null), "[Bad Request] A token is required."],
    ["alias", new PagedStatusItemRequest(token, "", 10, null), "[Bad Request] A user alias is required."],
  ] as const)("propagates empty %s validation errors", async (_description, request, message) => {
    await expect(facade.getMoreFeed(request)).rejects.toThrow(message);
  });

  it("allows the browser's POST preflight request", async () => {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/feed/list`, {
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
