/** @jest-environment node */
/// <reference types="node" />
// AI-assisted: see AI-ATTRIBUTION.md
import { User } from "tweeter-shared";
import type { UserRecord } from "../../../tweeter-server/src/model/dao/DAOModels";
import type { UserDAO } from "../../../tweeter-server/src/model/dao/UserDAO";
import type { FollowDAO } from "../../../tweeter-server/src/model/dao/FollowDAO";
import { FollowService } from "../../../tweeter-server/src/model/service/FollowService";
import { GetFollowersLambda } from "../../../tweeter-server/src/lambda/follow/GetFollowersLambda";
import { GetFolloweesLambda } from "../../../tweeter-server/src/lambda/follow/GetFolloweesLambda";

const profile = (alias: string): UserRecord => ({
  profile: { firstName: "Test", lastName: alias, alias, imageUrl: "https://example.com/profile.png" },
  passwordHash: "private-hash", followerCount: 0, followeeCount: 0,
});

describe.each([
  { method: "loadMoreFollowers" as const, query: "getFollowers" as const, other: "getFollowees" as const, Lambda: GetFollowersLambda },
  { method: "loadMoreFollowees" as const, query: "getFollowees" as const, other: "getFollowers" as const, Lambda: GetFolloweesLambda },
])("FollowService.$method", ({ method, query, other, Lambda }) => {
  let dao: jest.Mocked<FollowDAO>;
  let users: jest.Mocked<UserDAO>;
  let authorization: { authorize: jest.Mock<Promise<string>, [string]> };
  let service: FollowService;
  beforeEach(() => {
    dao = {
      follow: jest.fn(), unfollow: jest.fn(), isFollowing: jest.fn(), getCounts: jest.fn(),
      getFollowers: jest.fn(), getFollowees: jest.fn(),
    };
    dao[query].mockResolvedValue({ items: ["@a", "@b"], nextCursor: "@b" });
    users = { getUser: jest.fn().mockImplementation(async (alias: string) => profile(alias)), createUser: jest.fn() };
    authorization = { authorize: jest.fn().mockResolvedValue("@viewer") };
    service = new FollowService({ createFollowDAO: () => dao, createUserDAO: () => users }, authorization);
  });

  it("queries the correct direction and returns public Users in DAO order", async () => {
    const [items, hasMore] = await service[method]("token", "@owner", 10, null);
    expect(authorization.authorize).toHaveBeenCalledWith("token");
    expect(dao[query]).toHaveBeenCalledWith("@owner", 10, null);
    expect(dao[other]).not.toHaveBeenCalled();
    expect(items.every((item) => item instanceof User)).toBe(true);
    expect(items.map((item) => item.alias)).toEqual(["@a", "@b"]);
    expect(items[0].dto).not.toHaveProperty("passwordHash");
    expect(items[0].dto).not.toHaveProperty("followerCount");
    expect(hasMore).toBe(true);
    expect(authorization.authorize.mock.invocationCallOrder[0]).toBeLessThan(users.getUser.mock.invocationCallOrder[0]);
  });

  it("translates only the last user's alias into the DAO cursor", async () => {
    const cursor = User.fromDto(profile("@cursor").profile);
    await service[method]("token", "@owner", 10, cursor);
    expect(dao[query]).toHaveBeenCalledWith("@owner", 10, "@cursor");
  });

  it("preserves ordering when profile reads complete in reverse order", async () => {
    const completions = new Map<string, (record: UserRecord) => void>();
    let ready!: () => void;
    const started = new Promise<void>((resolve) => { ready = resolve; });
    users.getUser.mockImplementation(async (alias) => {
      if (alias === "@owner") return profile(alias);
      return new Promise<UserRecord>((resolve) => {
        completions.set(alias, resolve);
        if (completions.size === 2) ready();
      });
    });
    const operation = service[method]("token", "@owner", 10, null);
    await started;
    completions.get("@b")!(profile("@b"));
    completions.get("@a")!(profile("@a"));
    expect((await operation)[0].map((item) => item.alias)).toEqual(["@a", "@b"]);
  });

  it("returns an empty terminal page without related profile lookups", async () => {
    dao[query].mockResolvedValue({ items: [], nextCursor: null });
    await expect(service[method]("token", "@owner", 10, null)).resolves.toEqual([[], false]);
    expect(users.getUser).toHaveBeenCalledTimes(1); // Owner existence check only.
  });

  it("pages 13 stored profiles through the Lambda and JSON cursor without duplicates", async () => {
    const aliases = Array.from({ length: 13 }, (_, i) => `@user${String(i + 1).padStart(2, "0")}`);
    dao[query].mockImplementation(async (_owner, size, cursor) => {
      const remaining = aliases.filter((alias) => cursor === null || alias > cursor);
      const items = remaining.slice(0, size);
      return { items, nextCursor: remaining.length > size ? items[items.length - 1] : null };
    });
    const lambda = new Lambda(service);
    const request = { token: "token", userAlias: "@owner", pageSize: 10, lastItem: null };
    const first = await lambda.handle(request);
    const second = await lambda.handle(JSON.parse(JSON.stringify({ ...request, lastItem: first.items[9] })));
    const terminal = await lambda.handle({ ...request, lastItem: second.items[2] });
    expect([first.items.length, second.items.length, terminal.items.length]).toEqual([10, 3, 0]);
    expect([first.hasMore, second.hasMore, terminal.hasMore]).toEqual([true, false, false]);
    expect([...first.items, ...second.items].map((item) => item.alias)).toEqual(aliases);
    expect(new Set([...first.items, ...second.items].map((item) => item.alias)).size).toBe(13);
  });

  it("rejects an unknown owner before querying relationships", async () => {
    users.getUser.mockResolvedValue(null);
    await expect(service[method]("token", "@missing", 10, null)).rejects.toThrow("[Bad Request] User not found.");
    expect(dao[query]).not.toHaveBeenCalled();
  });

  it("rejects missing related profiles rather than dropping cursor rows", async () => {
    users.getUser.mockImplementation(async (alias) => alias === "@b" ? null : profile(alias));
    await expect(service[method]("token", "@owner", 10, null)).rejects.toThrow("A related user profile is missing.");
  });

  it.each(["[Unauthorized] Invalid or expired authentication token.", "Session store unavailable"])("blocks profile and relationship access on %s", async (message) => {
    const error = new Error(message);
    authorization.authorize.mockRejectedValue(error);
    await expect(service[method]("token", "@owner", 10, null)).rejects.toBe(error);
    expect(users.getUser).not.toHaveBeenCalled();
    expect(dao[query]).not.toHaveBeenCalled();
  });

  it.each(["owner", "relationships", "profile"])("propagates %s storage failure", async (operation) => {
    const error = new Error("Database unavailable");
    if (operation === "owner") users.getUser.mockRejectedValue(error);
    if (operation === "relationships") dao[query].mockRejectedValue(error);
    if (operation === "profile") users.getUser.mockImplementation(async (alias) => {
      if (alias === "@owner") return profile(alias);
      throw error;
    });
    await expect(service[method]("token", "@owner", 10, null)).rejects.toBe(error);
  });

  it("requires dependencies instead of falling back to FakeData", async () => {
    await expect(new FollowService()[method]("token", "@owner", 10, null)).rejects.toThrow("Relationship dependencies are required.");
  });
});
