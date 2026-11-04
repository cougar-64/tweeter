// AI-assisted: see AI-ATTRIBUTION.md
import type { PagedUserItemRequest, PagedUserItemResponse, UserDto } from "tweeter-shared";

const baseUrl = (
  process.env.TWEETER_API_BASE_URL ??
  "https://s58iqa332m.execute-api.us-east-1.amazonaws.com/dev"
).replace(/\/$/, "");
const endpoint = `${baseUrl}/followers/list`;
const origin = "http://localhost:5173";

const firstPageRequest: PagedUserItemRequest = {
  token: "milestone-3-test-token",
  userAlias: "@allen",
  pageSize: 10,
  lastItem: null,
};

function postFollowers(request: unknown): Promise<Response> {
  return fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(10000),
  });
}

describe("Deployed followers endpoint", () => {
  it("returns HTTP 200 with the expected first page and CORS header", async () => {
    const response = await postFollowers(firstPageRequest);

    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");

    const body: PagedUserItemResponse = await response.json();
    expect(body.success).toBe(true);
    expect(body.message).toBeNull();
    expect(body.hasMore).toBe(true);
    expect(body.items.map((user) => user.alias)).toEqual([
      "@amy", "@bob", "@bonnie", "@chris", "@cindy",
      "@dan", "@dee", "@elliott", "@elizabeth", "@frank",
    ]);
    expect(body.items[0]).toEqual({
      firstName: "Amy",
      lastName: "Ames",
      alias: "@amy",
      imageUrl: "https://faculty.cs.byu.edu/~jwilkerson/cs340/tweeter/images/daisy_duck.png",
    });
  });

  it("returns every follower once and stops after the final page", async () => {
    let lastItem: UserDto | null = null;
    const aliases: string[] = [];
    const expectedPageSizes = [10, 10, 1];

    for (let page = 0; page < expectedPageSizes.length; page++) {
      const response = await postFollowers({ ...firstPageRequest, lastItem });
      expect(response.status).toBe(200);

      const body: PagedUserItemResponse = await response.json();
      expect(body.success).toBe(true);
      expect(body.items).toHaveLength(expectedPageSizes[page]);
      expect(body.hasMore).toBe(page < expectedPageSizes.length - 1);

      aliases.push(...body.items.map((user) => user.alias));
      lastItem = body.items[body.items.length - 1];
    }

    expect(aliases).toHaveLength(21);
    expect(new Set(aliases).size).toBe(21);
    expect(aliases).not.toContain("@allen");
    expect(aliases[aliases.length - 1]).toBe("@kathy");

    const response = await postFollowers({ ...firstPageRequest, lastItem });
    expect(response.status).toBe(200);
    const body: PagedUserItemResponse = await response.json();
    expect(body.items).toEqual([]);
    expect(body.hasMore).toBe(false);
  });

  it.each([
    ["missing token", {}, "[Bad Request] A token is required."],
    ["invalid page size", { ...firstPageRequest, pageSize: 0 }, "[Bad Request] Page size must be a positive integer."],
    ["invalid last user", { ...firstPageRequest, lastItem: {} }, "[Bad Request] Last item must be a user DTO or null."],
  ])("returns HTTP 400 and CORS for %s", async (_description, request, message) => {
    const response = await postFollowers(request);

    expect(response.status).toBe(400);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(await response.json()).toEqual({ errorMessage: message });
  });

  it("allows the browser's POST preflight request", async () => {
    const response = await fetch(endpoint, {
      method: "OPTIONS",
      headers: {
        Origin: origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
      },
      signal: AbortSignal.timeout(10000),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("access-control-allow-methods")).toContain("POST");
    expect(response.headers.get("access-control-allow-headers")?.toLowerCase()).toContain("content-type");
    await response.text();
  });

  it("includes CORS when API Gateway rejects an unknown route", async () => {
    const response = await fetch(`${endpoint}/missing`, {
      headers: { Origin: origin },
      signal: AbortSignal.timeout(10000),
    });

    expect(response.status).toBe(403);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    await response.text();
  });
});
