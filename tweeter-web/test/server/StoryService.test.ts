/** @jest-environment node */
/// <reference types="node" />
// AI-assisted: see AI-ATTRIBUTION.md
import { Status, User } from "tweeter-shared";
import type { DAOFactory } from "../../../tweeter-server/src/model/dao/DAOFactory";
import type { UserDAO } from "../../../tweeter-server/src/model/dao/UserDAO";
import type { StoryDAO } from "../../../tweeter-server/src/model/dao/StoryDAO";
import type { StoredStatus } from "../../../tweeter-server/src/model/dao/DAOModels";
import { GetStoryLambda } from "../../../tweeter-server/src/lambda/status/GetStoryLambda";
import { StatusService } from "../../../tweeter-server/src/model/service/StatusService";

const author = new User("Amy", "Ames", "@amy", "https://example.com/amy.png");
const saved = (id: string, timestamp = 1000): StoredStatus => ({
  statusId: id, timestamp,
  status: new Status("Hello @bob https://example.com", author, timestamp, id).dto,
});

describe("Authenticated story retrieval", () => {
  let users: jest.Mocked<UserDAO>;
  let stories: jest.Mocked<StoryDAO>;
  let authorization: { authorize: jest.Mock<Promise<string>, [string]> };
  let factory: Pick<DAOFactory, "createUserDAO" | "createStoryDAO" | "createFeedDAO" | "createFollowDAO">;
  let service: StatusService;
  beforeEach(() => {
    users = { getUser: jest.fn().mockResolvedValue({ profile: author.dto, passwordHash: "private", followerCount: 0, followeeCount: 0 }), createUser: jest.fn() };
    stories = { getStory: jest.fn().mockResolvedValue({ items: [], nextCursor: null }), putStatus: jest.fn() };
    authorization = { authorize: jest.fn().mockResolvedValue("@viewer") };
    factory = { createUserDAO: () => users, createStoryDAO: () => stories, createFeedDAO: jest.fn(), createFollowDAO: jest.fn() };
    service = new StatusService(factory, authorization);
  });

  it("authenticates before profile/story access and allows viewing another author's story", async () => {
    stories.getStory.mockResolvedValue({ items: [saved("a")], nextCursor: null });
    const [items, hasMore] = await service.loadMoreStoryItems("token", "@amy", 10, null);
    expect(authorization.authorize).toHaveBeenCalledWith("token");
    expect(users.getUser).toHaveBeenCalledWith("@amy");
    expect(stories.getStory).toHaveBeenCalledWith("@amy", 10, null);
    expect(authorization.authorize.mock.invocationCallOrder[0]).toBeLessThan(users.getUser.mock.invocationCallOrder[0]);
    expect(users.getUser.mock.invocationCallOrder[0]).toBeLessThan(stories.getStory.mock.invocationCallOrder[0]);
    expect(items[0]).toBeInstanceOf(Status);
    expect(items[0].user).toBeInstanceOf(User);
    expect(items[0].dto).toEqual(saved("a").status);
    expect(items[0].dto).not.toHaveProperty("passwordHash");
    expect(hasMore).toBe(false);
    expect(stories.putStatus).not.toHaveBeenCalled();
    expect(factory.createFollowDAO).not.toHaveBeenCalled();
    expect(factory.createFeedDAO).not.toHaveBeenCalled();
  });

  it("carries JSON cursors through 13 posts with timestamp ties and an empty terminal page", async () => {
    const records = Array.from({ length: 13 }, (_, i) => saved(`id${String(12 - i).padStart(2, "0")}`));
    const cursor = { timestamp: 1000, statusId: records[9].statusId };
    stories.getStory.mockResolvedValueOnce({ items: records.slice(0, 10), nextCursor: cursor })
      .mockResolvedValueOnce({ items: records.slice(10), nextCursor: null })
      .mockResolvedValueOnce({ items: [], nextCursor: null });
    const lambda = new GetStoryLambda(service);
    const request = { token: "token", userAlias: "@amy", pageSize: 10, lastItem: null };
    const first = await lambda.handle(request);
    const second = await lambda.handle({ ...request, lastItem: JSON.parse(JSON.stringify(first.items[9])) });
    const terminal = await lambda.handle({ ...request, lastItem: second.items[2] });
    expect([first.items.length, second.items.length, terminal.items.length]).toEqual([10, 3, 0]);
    expect([first.hasMore, second.hasMore, terminal.hasMore]).toEqual([true, false, false]);
    expect([...first.items, ...second.items].map((item) => item.statusId)).toEqual(records.map((record) => record.statusId));
    expect(stories.getStory.mock.calls).toEqual([
      ["@amy", 10, null], ["@amy", 10, cursor], ["@amy", 10, { timestamp: 1000, statusId: records[12].statusId }],
    ]);
  });

  it("uses the DAO continuation rather than guessing hasMore from page length", async () => {
    stories.getStory.mockResolvedValue({ items: [saved("a")], nextCursor: { timestamp: 1000, statusId: "a" } });
    const [items, hasMore] = await service.loadMoreStoryItems("token", "@amy", 10, null);
    expect(items).toHaveLength(1);
    expect(hasMore).toBe(true);
    stories.getStory.mockResolvedValue({ items: [saved("a")], nextCursor: null });
    await expect(service.loadMoreStoryItems("token", "@amy", 1, null)).resolves.toEqual([[Status.fromDto(saved("a").status)], false]);
  });

  it("returns an existing user's empty story", async () => {
    await expect(service.loadMoreStoryItems("token", "@amy", 10, null)).resolves.toEqual([[], false]);
  });

  it.each(["[Unauthorized] Invalid or expired authentication token.", "Session store unavailable"])("blocks storage after %s", async (message) => {
    const error = new Error(message);
    authorization.authorize.mockRejectedValue(error);
    await expect(service.loadMoreStoryItems("token", "@amy", 10, null)).rejects.toBe(error);
    expect(users.getUser).not.toHaveBeenCalled();
    expect(stories.getStory).not.toHaveBeenCalled();
  });

  it("distinguishes a missing author from an empty story", async () => {
    users.getUser.mockResolvedValue(null);
    await expect(service.loadMoreStoryItems("token", "@missing", 10, null)).rejects.toThrow("[Bad Request] User not found.");
    expect(stories.getStory).not.toHaveBeenCalled();
  });

  it.each([
    new Status("legacy", author, 1000),
    new Status("wrong author", new User("Bob", "B", "@bob", "bob.png"), 1000, "id"),
    new Status("negative", author, -1, "id"),
    new Status("fractional", author, 0.5, "id"),
    new Status("unsafe", author, Number.MAX_SAFE_INTEGER + 1, "id"),
  ])("rejects an ambiguous or invalid persisted cursor %#", async (cursor) => {
    await expect(service.loadMoreStoryItems("token", "@amy", 10, cursor)).rejects.toThrow("[Bad Request] A story cursor");
    expect(stories.getStory).not.toHaveBeenCalled();
  });

  it.each(["profile", "story"])("propagates %s storage errors", async (operation) => {
    const error = new Error("Storage unavailable");
    if (operation === "profile") users.getUser.mockRejectedValue(error);
    else stories.getStory.mockRejectedValue(error);
    await expect(service.loadMoreStoryItems("token", "@amy", 10, null)).rejects.toBe(error);
    if (operation === "profile") expect(stories.getStory).not.toHaveBeenCalled();
  });

  it("requires injected dependencies", async () => {
    await expect(new StatusService().loadMoreStoryItems("token", "@amy", 10, null)).rejects.toThrow("Status dependencies are required.");
  });
});
