/** @jest-environment node */
/// <reference types="node" />
// AI-assisted: see AI-ATTRIBUTION.md
import { Status, User } from "tweeter-shared";
import type { UserDAO } from "../../../tweeter-server/src/model/dao/UserDAO";
import type { StoryDAO } from "../../../tweeter-server/src/model/dao/StoryDAO";
import type { FeedDAO } from "../../../tweeter-server/src/model/dao/FeedDAO";
import type { FollowDAO } from "../../../tweeter-server/src/model/dao/FollowDAO";
import { StatusService } from "../../../tweeter-server/src/model/service/StatusService";

const profile = { alias: "@amy", firstName: "Amy", lastName: "Ames", imageUrl: "https://example.com/real.png" };
const timestamp = 1700000000123;
const submitted = new Status("Hello @bob https://example.com\n", new User("Forged", "Name", "@victim", "fake.png"), 9999999999999, "client-claimed-id");

describe("StatusService posting and precomputed delivery", () => {
  let users: jest.Mocked<UserDAO>;
  let stories: jest.Mocked<StoryDAO>;
  let feeds: jest.Mocked<FeedDAO>;
  let follows: jest.Mocked<FollowDAO>;
  let authorization: { authorize: jest.Mock<Promise<string>, [string]> };
  let service: StatusService;

  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(timestamp);
    users = { getUser: jest.fn().mockResolvedValue({ profile, passwordHash: "private-hash", followerCount: 2, followeeCount: 0 }), createUser: jest.fn() };
    stories = { putStatus: jest.fn(), getStory: jest.fn() };
    feeds = { putEntries: jest.fn(), getFeed: jest.fn() };
    follows = {
      follow: jest.fn(), unfollow: jest.fn(), isFollowing: jest.fn(), getCounts: jest.fn(),
      getFollowers: jest.fn().mockResolvedValue({ items: ["@bob", "@carol"], nextCursor: null }), getFollowees: jest.fn(),
    };
    authorization = { authorize: jest.fn().mockResolvedValue("@amy") };
    service = new StatusService({
      createUserDAO: () => users, createStoryDAO: () => stories,
      createFeedDAO: () => feeds, createFollowDAO: () => follows,
    }, authorization);
  });
  afterEach(() => jest.restoreAllMocks());

  it("uses the authenticated profile and server metadata, saves the story, and copies the same post to followers", async () => {
    await service.postStatus("token", submitted);
    const record = stories.putStatus.mock.calls[0][0];
    expect(authorization.authorize).toHaveBeenCalledWith("token");
    expect(users.getUser).toHaveBeenCalledWith("@amy");
    expect(record.statusId).toMatch(/^[a-f0-9-]{36}$/);
    expect(record.statusId).not.toBe(submitted.statusId);
    expect(record).toEqual({
      statusId: record.statusId, timestamp,
      status: { post: submitted.post, user: profile, timestamp, statusId: record.statusId },
    });
    expect(record.status).not.toHaveProperty("passwordHash");
    expect(follows.getFollowers).toHaveBeenCalledWith("@amy", 100, null);
    expect(feeds.putEntries).toHaveBeenCalledWith(["@bob", "@carol"], record);
    expect(feeds.putEntries.mock.calls[0][1]).toBe(record);
    expect(stories.putStatus.mock.invocationCallOrder[0]).toBeLessThan(follows.getFollowers.mock.invocationCallOrder[0]);
    expect(authorization.authorize.mock.invocationCallOrder[0]).toBeLessThan(users.getUser.mock.invocationCallOrder[0]);
    expect(feeds.getFeed).not.toHaveBeenCalled();
    expect(stories.getStory).not.toHaveBeenCalled();
  });

  it("creates distinct server IDs for posts made at the same timestamp", async () => {
    await service.postStatus("token", submitted);
    await service.postStatus("token", submitted);
    const [first, second] = stories.putStatus.mock.calls.map(([record]) => record);
    expect(first.timestamp).toBe(second.timestamp);
    expect(first.statusId).not.toBe(second.statusId);
  });

  it("visits every follower page and awaits delivery before requesting the next", async () => {
    const first = Array.from({ length: 100 }, (_, i) => `@follower${String(i).padStart(3, "0")}`);
    const second = Array.from({ length: 13 }, (_, i) => `@remaining${i}`);
    follows.getFollowers.mockResolvedValueOnce({ items: first, nextCursor: first[99] })
      .mockResolvedValueOnce({ items: second, nextCursor: null });
    await service.postStatus("token", submitted);
    expect(follows.getFollowers.mock.calls).toEqual([["@amy", 100, null], ["@amy", 100, first[99]]]);
    expect(feeds.putEntries.mock.calls.map(([aliases]) => aliases)).toEqual([first, second]);
    expect(feeds.putEntries.mock.calls.every(([, record]) => record === stories.putStatus.mock.calls[0][0])).toBe(true);
    expect(feeds.putEntries.mock.invocationCallOrder[0]).toBeLessThan(follows.getFollowers.mock.invocationCallOrder[1]);
  });

  it("persists a story with no feed writes when the author has no followers", async () => {
    follows.getFollowers.mockResolvedValue({ items: [], nextCursor: null });
    await service.postStatus("token", submitted);
    expect(stories.putStatus).toHaveBeenCalledTimes(1);
    expect(feeds.putEntries).not.toHaveBeenCalled();
  });

  it("does not report success while feed delivery is pending", async () => {
    let complete!: () => void;
    let started!: () => void;
    const pending = new Promise<void>((resolve) => { complete = resolve; });
    const delivering = new Promise<void>((resolve) => { started = resolve; });
    feeds.putEntries.mockImplementation(async () => { started(); await pending; });
    let settled = false;
    const operation = service.postStatus("token", submitted).then(() => { settled = true; });
    await delivering;
    expect(settled).toBe(false);
    complete();
    await operation;
    expect(settled).toBe(true);
  });

  it.each(["[Unauthorized] Invalid or expired authentication token.", "Session store unavailable"])("propagates authorization failure %s without storage access", async (message) => {
    const error = new Error(message);
    authorization.authorize.mockRejectedValue(error);
    await expect(service.postStatus("token", submitted)).rejects.toBe(error);
    expect(users.getUser).not.toHaveBeenCalled();
    expect(stories.putStatus).not.toHaveBeenCalled();
    expect(follows.getFollowers).not.toHaveBeenCalled();
    expect(feeds.putEntries).not.toHaveBeenCalled();
  });

  it("rejects an authenticated session whose user no longer exists", async () => {
    users.getUser.mockResolvedValue(null);
    await expect(service.postStatus("token", submitted)).rejects.toThrow("[Unauthorized]");
    expect(stories.putStatus).not.toHaveBeenCalled();
    expect(follows.getFollowers).not.toHaveBeenCalled();
  });

  it("rejects blank text without writing a story or feed", async () => {
    await expect(service.postStatus("token", new Status(" \n ", submitted.user, 0))).rejects.toThrow("[Bad Request] A nonempty post is required.");
    expect(users.getUser).not.toHaveBeenCalled();
    expect(stories.putStatus).not.toHaveBeenCalled();
    expect(feeds.putEntries).not.toHaveBeenCalled();
  });

  it.each(["profile", "story", "followers", "feed"])("propagates %s storage failure", async (operation) => {
    const error = new Error(`${operation} unavailable`);
    if (operation === "profile") users.getUser.mockRejectedValue(error);
    if (operation === "story") stories.putStatus.mockRejectedValue(error);
    if (operation === "followers") follows.getFollowers.mockRejectedValue(error);
    if (operation === "feed") feeds.putEntries.mockRejectedValue(error);
    await expect(service.postStatus("token", submitted)).rejects.toBe(error);
    if (operation === "profile" || operation === "story") expect(follows.getFollowers).not.toHaveBeenCalled();
    if (operation !== "feed") expect(feeds.putEntries).not.toHaveBeenCalled();
    if (operation === "followers" || operation === "feed") expect(stories.putStatus).toHaveBeenCalledTimes(1);
  });

  it("stops at a later feed failure instead of advancing further or replacing the saved story", async () => {
    const error = new Error("Feed delivery incomplete");
    follows.getFollowers.mockResolvedValueOnce({ items: ["@bob"], nextCursor: "@bob" })
      .mockResolvedValueOnce({ items: ["@carol"], nextCursor: "@carol" })
      .mockResolvedValue({ items: ["@dan"], nextCursor: null });
    feeds.putEntries.mockResolvedValueOnce(undefined).mockRejectedValueOnce(error);
    await expect(service.postStatus("token", submitted)).rejects.toBe(error);
    expect(follows.getFollowers).toHaveBeenCalledTimes(2);
    expect(feeds.putEntries).toHaveBeenCalledTimes(2);
    expect(stories.putStatus).toHaveBeenCalledTimes(1);
  });

  it("rejects a non-advancing follower cursor instead of looping forever", async () => {
    follows.getFollowers.mockResolvedValue({ items: ["@bob"], nextCursor: "@bob" });
    await expect(service.postStatus("token", submitted)).rejects.toThrow("Follower pagination did not advance.");
    expect(follows.getFollowers).toHaveBeenCalledTimes(2);
    expect(feeds.putEntries).toHaveBeenCalledTimes(1);
  });

  it("requires injected dependencies instead of simulating a post", async () => {
    await expect(new StatusService().postStatus("token", submitted)).rejects.toThrow("Status dependencies are required.");
  });
});
