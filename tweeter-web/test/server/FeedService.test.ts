/** @jest-environment node */
/// <reference types="node" />
// AI-assisted: see AI-ATTRIBUTION.md
import { Status, User } from "tweeter-shared";
import type { UserDAO } from "../../../tweeter-server/src/model/dao/UserDAO";
import type { FeedDAO } from "../../../tweeter-server/src/model/dao/FeedDAO";
import type { StoredStatus } from "../../../tweeter-server/src/model/dao/DAOModels";
import { GetFeedLambda } from "../../../tweeter-server/src/lambda/status/GetFeedLambda";
import { StatusService } from "../../../tweeter-server/src/model/service/StatusService";

const owner = new User("Amy", "Ames", "@amy", "https://example.com/amy.png");
const authors = [new User("Bob", "B", "@bob", "bob.png"), new User("Carol", "C", "@carol", "carol.png")];
const saved = (id: string, author = authors[0]): StoredStatus => ({
  statusId: id, timestamp: 1000,
  status: new Status("Hello @amy https://example.com", author, 1000, id).dto,
});

describe("Authenticated precomputed feed retrieval", () => {
  let users: jest.Mocked<UserDAO>;
  let feeds: jest.Mocked<FeedDAO>;
  let authorization: { authorize: jest.Mock<Promise<string>, [string]> };
  let factory: {
    createUserDAO: () => UserDAO; createFeedDAO: () => FeedDAO;
    createStoryDAO: jest.Mock; createFollowDAO: jest.Mock;
  };
  let service: StatusService;
  beforeEach(() => {
    users = { getUser: jest.fn().mockResolvedValue({ profile: owner.dto, passwordHash: "private", followerCount: 0, followeeCount: 2 }), createUser: jest.fn() };
    feeds = { getFeed: jest.fn().mockResolvedValue({ items: [], nextCursor: null }), putEntries: jest.fn() };
    authorization = { authorize: jest.fn().mockResolvedValue("@viewer") };
    factory = { createUserDAO: () => users, createFeedDAO: () => feeds, createStoryDAO: jest.fn(), createFollowDAO: jest.fn() };
    service = new StatusService(factory, authorization);
  });

  it("authenticates then queries only the requested owner's precomputed feed", async () => {
    feeds.getFeed.mockResolvedValue({ items: [saved("a")], nextCursor: null });
    const [items, hasMore] = await service.loadMoreFeedItems("token", "@amy", 10, null);
    expect(authorization.authorize).toHaveBeenCalledWith("token");
    // The UI supports viewing a selected user's tabs, including their feed.
    expect(users.getUser.mock.calls).toEqual([["@amy"]]);
    expect(feeds.getFeed).toHaveBeenCalledWith("@amy", 10, null);
    expect(authorization.authorize.mock.invocationCallOrder[0]).toBeLessThan(users.getUser.mock.invocationCallOrder[0]);
    expect(users.getUser.mock.invocationCallOrder[0]).toBeLessThan(feeds.getFeed.mock.invocationCallOrder[0]);
    expect(items[0]).toBeInstanceOf(Status);
    expect(items[0].user).toBeInstanceOf(User);
    expect(items[0].dto).toEqual(saved("a").status);
    expect(items[0].user.alias).toBe("@bob");
    expect(items[0].dto).not.toHaveProperty("passwordHash");
    expect(hasMore).toBe(false);
    expect(factory.createStoryDAO).not.toHaveBeenCalled();
    expect(factory.createFollowDAO).not.toHaveBeenCalled();
    expect(feeds.putEntries).not.toHaveBeenCalled();
  });

  it("preserves mixed-author snapshots across JSON pages of 10/3/0 with timestamp ties", async () => {
    const records = Array.from({ length: 13 }, (_, i) => saved(`id${String(12 - i).padStart(2, "0")}`, authors[i % 2]));
    const cursor = { timestamp: 1000, statusId: records[9].statusId };
    feeds.getFeed.mockResolvedValueOnce({ items: records.slice(0, 10), nextCursor: cursor })
      .mockResolvedValueOnce({ items: records.slice(10), nextCursor: null })
      .mockResolvedValueOnce({ items: [], nextCursor: null });
    const lambda = new GetFeedLambda(service);
    const request = { token: "token", userAlias: "@amy", pageSize: 10, lastItem: null };
    const first = await lambda.handle(request);
    const second = await lambda.handle({ ...request, lastItem: JSON.parse(JSON.stringify(first.items[9])) });
    const terminal = await lambda.handle({ ...request, lastItem: second.items[2] });
    expect([first.items.length, second.items.length, terminal.items.length]).toEqual([10, 3, 0]);
    expect([first.hasMore, second.hasMore, terminal.hasMore]).toEqual([true, false, false]);
    expect([...first.items, ...second.items]).toEqual(records.map((record) => record.status));
    expect(new Set([...first.items, ...second.items].map((item) => item.statusId)).size).toBe(13);
    expect(feeds.getFeed.mock.calls).toEqual([
      ["@amy", 10, null], ["@amy", 10, cursor], ["@amy", 10, { timestamp: 1000, statusId: records[12].statusId }],
    ]);
  });

  it("scopes every cursor to the requested owner rather than the cursor's author", async () => {
    const cursor = Status.fromDto(saved("a").status);
    await service.loadMoreFeedItems("token", "@amy", 10, cursor);
    await service.loadMoreFeedItems("token", "@other-owner", 10, cursor);
    expect(feeds.getFeed.mock.calls).toEqual([
      ["@amy", 10, { timestamp: 1000, statusId: "a" }],
      ["@other-owner", 10, { timestamp: 1000, statusId: "a" }],
    ]);
    expect(factory.createStoryDAO).not.toHaveBeenCalled();
    expect(factory.createFollowDAO).not.toHaveBeenCalled();
  });

  it("returns a new user's empty feed", async () => {
    await expect(service.loadMoreFeedItems("token", "@amy", 10, null)).resolves.toEqual([[], false]);
  });

  it("derives hasMore from the DAO continuation instead of page length", async () => {
    feeds.getFeed.mockResolvedValue({ items: [saved("a")], nextCursor: { timestamp: 1000, statusId: "a" } });
    expect((await service.loadMoreFeedItems("token", "@amy", 10, null))[1]).toBe(true);
    feeds.getFeed.mockResolvedValue({ items: [saved("a")], nextCursor: null });
    expect((await service.loadMoreFeedItems("token", "@amy", 1, null))[1]).toBe(false);
  });

  it.each(["[Unauthorized] Invalid or expired authentication token.", "Session store unavailable"])("blocks storage after %s", async (message) => {
    const error = new Error(message);
    authorization.authorize.mockRejectedValue(error);
    await expect(service.loadMoreFeedItems("token", "@amy", 10, null)).rejects.toBe(error);
    expect(users.getUser).not.toHaveBeenCalled();
    expect(feeds.getFeed).not.toHaveBeenCalled();
  });

  it("distinguishes a missing owner from an empty feed", async () => {
    users.getUser.mockResolvedValue(null);
    await expect(service.loadMoreFeedItems("token", "@missing", 10, null)).rejects.toThrow("[Bad Request] User not found.");
    expect(feeds.getFeed).not.toHaveBeenCalled();
  });

  it.each([
    new Status("legacy", authors[0], 1000),
    new Status("negative", authors[0], -1, "id"),
    new Status("fractional", authors[0], 0.5, "id"),
    new Status("unsafe", authors[0], Number.MAX_SAFE_INTEGER + 1, "id"),
  ])("rejects an ambiguous or invalid persisted cursor %#", async (cursor) => {
    await expect(service.loadMoreFeedItems("token", "@amy", 10, cursor)).rejects.toThrow("[Bad Request] A feed cursor");
    expect(feeds.getFeed).not.toHaveBeenCalled();
  });

  it.each(["profile", "feed"])("propagates %s storage errors", async (operation) => {
    const error = new Error("Storage unavailable");
    if (operation === "profile") users.getUser.mockRejectedValue(error);
    else feeds.getFeed.mockRejectedValue(error);
    await expect(service.loadMoreFeedItems("token", "@amy", 10, null)).rejects.toBe(error);
    if (operation === "profile") expect(feeds.getFeed).not.toHaveBeenCalled();
  });

  it("requires injected dependencies instead of returning dummy data", async () => {
    await expect(new StatusService().loadMoreFeedItems("token", "@amy", 10, null)).rejects.toThrow("Status dependencies are required.");
  });
});
