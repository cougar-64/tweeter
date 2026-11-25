/** @jest-environment node */
/// <reference types="node" />
// AI-assisted: see AI-ATTRIBUTION.md
import { isPersistedStatusDto } from "tweeter-shared";
import { buildMilestone4Fixtures, fixtureUsers, relatedFixtureUsers } from "../../../tweeter-server/src/tools/milestone4Fixtures";
import { seedMilestone4 } from "../../../tweeter-server/src/tools/seedMilestone4";
import type { DAOFactory } from "../../../tweeter-server/src/model/dao/DAOFactory";

const namespace = "seedtest";
const imageUrl = "https://example.com/seed.png";
function setup() {
  const users = { getUser: jest.fn().mockResolvedValue(null), createUser: jest.fn().mockResolvedValue(true) };
  const images = { putImage: jest.fn().mockResolvedValue({ imageId: "seed.png", url: imageUrl }), deleteImage: jest.fn() };
  const stories = { putStatus: jest.fn().mockResolvedValue(undefined), getStory: jest.fn() };
  const feeds = { putEntries: jest.fn().mockResolvedValue(undefined), getFeed: jest.fn() };
  const follows = { follow: jest.fn().mockResolvedValue(undefined), unfollow: jest.fn(), isFollowing: jest.fn(), getCounts: jest.fn(), getFollowers: jest.fn(), getFollowees: jest.fn() };
  const sessions = { createSession: jest.fn(), refreshSession: jest.fn(), deleteSession: jest.fn() };
  const factory: DAOFactory = {
    createUserDAO: () => users, createImageDAO: () => images, createStoryDAO: () => stories,
    createFeedDAO: () => feeds, createFollowDAO: () => follows, createSessionDAO: () => sessions,
  };
  const hash = jest.fn().mockImplementation(async () => `salted-password-hash-${hash.mock.calls.length}`);
  return { users, images, stories, feeds, follows, sessions, factory, hash, pause: jest.fn().mockResolvedValue(undefined) };
}

it("builds deterministic isolated fixtures with more than ten items in every main-user tab, unique IDs and timestamp ties", () => {
  const fixtures = buildMilestone4Fixtures(namespace, imageUrl);
  expect(buildMilestone4Fixtures(namespace, imageUrl)).toEqual(fixtures);
  expect(new Set(fixtureUsers(fixtures).map((user) => user.alias)).size).toBe(14);
  expect(fixtures.version).toBe(3);
  expect(fixtureUsers(fixtures).map((user) => user.alias)).toEqual(Array.from({ length: 14 }, (_, i) => `@user${i + 1}`));
  expect(fixtureUsers(fixtures).map((user) => `${user.firstName} ${user.lastName}`)).toEqual(Array.from({ length: 14 }, (_, i) => `User ${i + 1}`));
  expect(fixtures.stories.authorA).toHaveLength(13);
  expect(fixtures.stories.authorB).toHaveLength(13);
  expect(fixtures.feed).toHaveLength(26);
  expect(fixtures.stories.reader).toHaveLength(13);
  expect(relatedFixtureUsers(fixtures, fixtures.users.reader.alias, "followers")).toHaveLength(12);
  expect(relatedFixtureUsers(fixtures, fixtures.users.reader.alias, "followees")).toHaveLength(12);
  expect(fixtures.relationships).toHaveLength(24);
  expect(Object.values(fixtures.stories).flat()).toHaveLength(39);
  expect(Object.values(fixtures.feeds).flat()).toHaveLength(182);
  expect(fixtures.feeds[fixtures.users.empty.alias]).toEqual([]);
  expect(fixtureUsers(fixtures).every((user) => /^@[A-Za-z0-9]+$/.test(user.alias))).toBe(true);
  expect(new Set(Object.values(fixtures.stories).flat().map((record) => record.statusId)).size).toBe(39);
  expect(fixtures.feed.every((record) => isPersistedStatusDto(record.status))).toBe(true);
  expect(new Set(fixtures.feed.map((record) => record.statusId)).size).toBe(26);
  expect(new Set(fixtures.feed.map((record) => record.timestamp)).size).toBe(4);
  expect(fixtures.stories.authorA.every((record) => record.status.user.alias === fixtures.users.authorA.alias)).toBe(true);
  expect(fixtures.feed.every((record) => record.status.user.alias !== fixtures.users.reader.alias && record.status.user.alias !== fixtures.users.empty.alias)).toBe(true);
  expect(fixtures.feed.map((record) => `${record.timestamp}#${record.statusId}`)).toEqual(
    fixtures.feed.map((record) => `${record.timestamp}#${record.statusId}`).sort().reverse()
  );
});

it.each(["", "short", "../escape", "UPPERCASE", "a".repeat(25)])("rejects invalid namespace %s before storage access", async (value) => {
  const context = setup();
  await expect(seedMilestone4(context.factory, value, context.hash, new Uint8Array([1]), context.pause)).rejects.toThrow("Fixture namespace");
  expect(context.users.getUser).not.toHaveBeenCalled();
  expect(context.images.putImage).not.toHaveBeenCalled();
});

it("seeds fresh accounts with separately hashed passwords, relationships and exact story/feed snapshots without creating sessions", async () => {
  const context = setup();
  const fixtures = await seedMilestone4(context.factory, namespace, context.hash, new Uint8Array([1]), context.pause);
  expect(context.users.getUser.mock.calls.map(([alias]) => alias)).toEqual(fixtureUsers(fixtures).map((user) => user.alias));
  expect(context.images.putImage).toHaveBeenCalledWith(expect.stringMatching(/^seedtest-[a-f0-9-]{36}\.png$/), new Uint8Array([1]), "image/png");
  expect(context.hash).toHaveBeenCalledTimes(14);
  expect(new Set(context.users.createUser.mock.calls.map(([, hash]) => hash)).size).toBe(14);
  expect(context.users.createUser.mock.calls.map(([user]) => user)).toEqual(fixtureUsers(fixtures));
  expect(context.follows.follow.mock.calls).toEqual(fixtures.relationships.map((edge) => [edge.followerAlias, edge.followeeAlias]));
  const records = Object.values(fixtures.stories).flat();
  expect(context.stories.putStatus.mock.calls.map(([record]) => record)).toEqual(records);
  const actualDeliveries = context.feeds.putEntries.mock.calls.flatMap(([aliases, record]) =>
    aliases.map((alias: string) => `${alias}|${record.statusId}`)).sort();
  const expectedDeliveries = Object.entries(fixtures.feeds).flatMap(([alias, entries]) =>
    entries.map((record) => `${alias}|${record.statusId}`)).sort();
  expect(actualDeliveries).toEqual(expectedDeliveries);
  expect(new Set(actualDeliveries).size).toBe(182);
  expect(context.sessions.createSession).not.toHaveBeenCalled();
  expect(context.follows.getFollowers).not.toHaveBeenCalled();
  expect(JSON.stringify(fixtures)).not.toMatch(/password|token|salted-password-hash/i);
});

it("refuses an existing namespace before hashing, uploading, or overwriting any accounts", async () => {
  const context = setup();
  context.users.getUser.mockResolvedValueOnce(null).mockResolvedValueOnce({ profile: {} });
  await expect(seedMilestone4(context.factory, namespace, context.hash, new Uint8Array([1]), context.pause)).rejects.toThrow("already exists");
  expect(context.hash).not.toHaveBeenCalled();
  expect(context.images.putImage).not.toHaveBeenCalled();
  expect(context.users.createUser).not.toHaveBeenCalled();
  expect(context.stories.putStatus).not.toHaveBeenCalled();
});

it("stops on a concurrent alias reservation without continuing relationship/story/feed writes", async () => {
  const context = setup();
  context.users.createUser.mockResolvedValueOnce(false);
  await expect(seedMilestone4(context.factory, namespace, context.hash, new Uint8Array([1]), context.pause)).rejects.toThrow("concurrently created");
  expect(context.users.createUser).toHaveBeenCalledTimes(1);
  expect(context.follows.follow).not.toHaveBeenCalled();
  expect(context.stories.putStatus).not.toHaveBeenCalled();
});

it.each(["image", "user", "follow", "story", "feed"])("propagates %s failure instead of reporting a completed seed", async (operation) => {
  const context = setup();
  const error = new Error("Seed storage unavailable");
  const methods = { image: context.images.putImage, user: context.users.createUser, follow: context.follows.follow,
    story: context.stories.putStatus, feed: context.feeds.putEntries };
  methods[operation as keyof typeof methods].mockRejectedValueOnce(error);
  await expect(seedMilestone4(context.factory, namespace, context.hash, new Uint8Array([1]), context.pause)).rejects.toBe(error);
  if (operation === "image") expect(context.users.createUser).not.toHaveBeenCalled();
  if (operation !== "feed") expect(context.feeds.putEntries).not.toHaveBeenCalled();
  if (operation === "feed") expect(context.feeds.putEntries).toHaveBeenCalledTimes(1);
  // Seed is deliberately nontransactional; it never deletes potentially committed data.
  expect(context.images.deleteImage).not.toHaveBeenCalled();
});
