// AI-assisted: see AI-ATTRIBUTION.md
import { AuthToken, PagedUserItemRequest, User } from "tweeter-shared";
import { ServerFacade } from "../../src/net/ServerFacade";
import { FollowService } from "../../src/model.service/FollowService";

const baseUrl = process.env.TWEETER_API_BASE_URL ??
  "https://s58iqa332m.execute-api.us-east-1.amazonaws.com/dev";
const serverFacade = new ServerFacade(baseUrl);
const token = "milestone-3-test-token";

describe("Followees integration", () => {
  it("retrieves the expected first page as User instances", async () => {
    const [users, hasMore] = await serverFacade.getMoreFollowees(
      new PagedUserItemRequest(token, "@allen", 10, null)
    );

    expect(users.map((user) => user.alias)).toEqual([
      "@amy", "@bob", "@bonnie", "@chris", "@cindy",
      "@dan", "@dee", "@elliott", "@elizabeth", "@frank",
    ]);
    expect(users.every((user) => user instanceof User)).toBe(true);
    expect(users[0].name).toBe("Amy Ames");
    expect(hasMore).toBe(true);
  });

  it("retrieves all followees once and stops after the final page", async () => {
    let lastItem: User | null = null;
    const aliases: string[] = [];
    const expectedPageSizes = [10, 10, 1];

    for (let page = 0; page < expectedPageSizes.length; page++) {
      const [users, hasMore] = await serverFacade.getMoreFollowees(
        new PagedUserItemRequest(token, "@allen", 10, lastItem === null ? null : lastItem.dto)
      );
      expect(users).toHaveLength(expectedPageSizes[page]);
      expect(hasMore).toBe(page < expectedPageSizes.length - 1);
      aliases.push(...users.map((user) => user.alias));
      lastItem = users[users.length - 1];
    }

    expect(new Set(aliases).size).toBe(21);
    expect(aliases).not.toContain("@allen");
    expect(aliases[20]).toBe("@kathy");

    const [users, hasMore] = await serverFacade.getMoreFollowees(
      new PagedUserItemRequest(token, "@allen", 10, lastItem!.dto)
    );
    expect(users).toEqual([]);
    expect(hasMore).toBe(false);
  });

  it("propagates the server's validation error", async () => {
    await expect(
      serverFacade.getMoreFollowees(new PagedUserItemRequest(token, "@allen", 0, null))
    ).rejects.toThrow("[Bad Request] Page size must be a positive integer.");
  });

  it("paginates through the client FollowService with domain objects", async () => {
    const service = new FollowService(serverFacade);
    const authToken = new AuthToken(token, Date.now());
    const [firstPage, firstHasMore] = await service.loadMoreFollowees(authToken, "@allen", 10, null);
    const [secondPage, secondHasMore] = await service.loadMoreFollowees(
      authToken, "@allen", 10, firstPage[9]
    );

    expect(firstPage).toHaveLength(10);
    expect(firstPage[0]).toBeInstanceOf(User);
    expect(firstPage[0].name).toBe("Amy Ames");
    expect(firstHasMore).toBe(true);
    expect(secondPage).toHaveLength(10);
    expect(secondPage[0]).toBeInstanceOf(User);
    expect(secondPage[0].alias).toBe("@fran");
    expect(secondHasMore).toBe(true);
    expect(new Set([...firstPage, ...secondPage].map((user) => user.alias)).size).toBe(20);
  });

  it("allows the browser's POST preflight request", async () => {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/followees/list`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:5173",
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
});
