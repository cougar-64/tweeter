// AI-assisted: see AI-ATTRIBUTION.md
import { AuthToken, PagedUserItemRequest, User } from "tweeter-shared";
import { ServerFacade } from "../../src/net/ServerFacade";
import { FollowService } from "../../src/model.service/FollowService";

const serverFacade = new ServerFacade(process.env.TWEETER_API_BASE_URL);
const token = "milestone-3-test-token";

describe("ServerFacade followers integration", () => {
  it("retrieves the expected followers as User instances", async () => {
    const request = new PagedUserItemRequest(token, "@allen", 10, null);
    const [users, hasMore] = await serverFacade.getMoreFollowers(request);

    expect(users.map((user) => user.alias)).toEqual([
      "@amy", "@bob", "@bonnie", "@chris", "@cindy",
      "@dan", "@dee", "@elliott", "@elizabeth", "@frank",
    ]);
    expect(hasMore).toBe(true);
    expect(users.every((user) => user instanceof User)).toBe(true);
    expect(users[0].firstName).toBe("Amy");
    expect(users[0].lastName).toBe("Ames");
    expect(users[0].name).toBe("Amy Ames");
    expect(users[0].equals(new User("Amy", "Ames", "@amy", users[0].imageUrl))).toBe(true);
  });

  it("uses the last user's DTO to retrieve the next page", async () => {
    const [firstPage] = await serverFacade.getMoreFollowers(
      new PagedUserItemRequest(token, "@allen", 10, null)
    );
    const [secondPage, hasMore] = await serverFacade.getMoreFollowers(
      new PagedUserItemRequest(token, "@allen", 10, firstPage[9].dto)
    );

    expect(secondPage).toHaveLength(10);
    expect(secondPage[0].alias).toBe("@fran");
    expect(secondPage[9].alias).toBe("@kent");
    expect(hasMore).toBe(true);
    expect(new Set([...firstPage, ...secondPage].map((user) => user.alias)).size).toBe(20);
  });

  it("propagates the server's validation error to the caller", async () => {
    await expect(
      serverFacade.getMoreFollowers(new PagedUserItemRequest(token, "@allen", 0, null))
    ).rejects.toThrow("[Bad Request] Page size must be a positive integer.");
  });
});

describe("Client FollowService followers integration", () => {
  it("sends domain objects through the full client network path and paginates", async () => {
    const service = new FollowService(serverFacade);
    const authToken = new AuthToken(token, Date.now());
    const [firstPage, firstHasMore] = await service.loadMoreFollowers(authToken, "@allen", 10, null);
    const [secondPage, secondHasMore] = await service.loadMoreFollowers(
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
});
