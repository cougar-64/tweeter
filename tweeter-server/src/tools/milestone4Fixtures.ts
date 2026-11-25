// AI-assisted: see AI-ATTRIBUTION.md
import type { UserDto } from "tweeter-shared";
import type { StoredStatus } from "../model/dao/DAOModels";

export const fixtureImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNQaLgAAAI0AXFUk8N2AAAAAElFTkSuQmCC";

export function fixtureUsers(fixtures: { users: Record<string, UserDto>; peers: readonly UserDto[] }): UserDto[] {
  return [...Object.values(fixtures.users), ...fixtures.peers];
}

export function buildMilestone4Fixtures(namespace: string, imageUrl: string) {
  if (!/^[a-z0-9]{6,24}$/.test(namespace)) throw new Error("Fixture namespace must be 6-24 lowercase letters/digits.");
  // Fixed, short test aliases; the namespace still separates status IDs/images.
  const profile = (number: number): UserDto => ({
    alias: `@user${number}`, firstName: "User", lastName: String(number), imageUrl,
  });
  const users = {
    reader: profile(1), authorA: profile(2), authorB: profile(3), empty: profile(4),
  };
  const peers = Array.from({ length: 10 }, (_, i) => profile(i + 5));
  const accounts = fixtureUsers({ users, peers });
  const relationships = [users.authorA, users.authorB, ...peers].flatMap((user) => [
    { followerAlias: users.reader.alias, followeeAlias: user.alias },
    { followerAlias: user.alias, followeeAlias: users.reader.alias },
  ]);
  const story = (author: UserDto, suffix: string): StoredStatus[] => Array.from({ length: 13 }, (_, i) => {
    const timestamp = 1700000000000 + Math.floor(i / 4);
    const statusId = `${namespace}-${suffix}-${String(i).padStart(2, "0")}`;
    const mention = author.alias === users.reader.alias ? users.authorA.alias : users.reader.alias;
    return { timestamp, statusId, status: {
      timestamp, statusId, user: author,
      post: `Fixture ${suffix} ${i + 1}: hello ${mention} https://example.com\nPagination check.`,
    } };
  });
  const newestFirst = (a: StoredStatus, b: StoredStatus) =>
    b.timestamp - a.timestamp || (a.statusId < b.statusId ? 1 : a.statusId > b.statusId ? -1 : 0);
  const stories = {
    authorA: story(users.authorA, "a").sort(newestFirst),
    authorB: story(users.authorB, "b").sort(newestFirst),
    reader: story(users.reader, "r").sort(newestFirst),
  };
  const records = Object.values(stories).flat();
  const feeds: Record<string, StoredStatus[]> = Object.fromEntries(accounts.map((owner) => {
    const followed = new Set(relationships.filter((edge) => edge.followerAlias === owner.alias).map((edge) => edge.followeeAlias));
    return [owner.alias, records.filter((record) => followed.has(record.status.user.alias)).sort(newestFirst)];
  }));
  return { version: 3 as const, namespace, imageUrl, users, peers, relationships, stories,
    feed: feeds[users.reader.alias], feeds };
}

export type Milestone4Fixtures = ReturnType<typeof buildMilestone4Fixtures>;

export function relatedFixtureUsers(fixtures: Milestone4Fixtures, ownerAlias: string, direction: "followers" | "followees"): UserDto[] {
  const related = new Set(fixtures.relationships
    .filter((edge) => (direction === "followers" ? edge.followeeAlias : edge.followerAlias) === ownerAlias)
    .map((edge) => direction === "followers" ? edge.followerAlias : edge.followeeAlias));
  return fixtureUsers(fixtures).filter((user) => related.has(user.alias))
    .sort((a, b) => a.alias < b.alias ? -1 : a.alias > b.alias ? 1 : 0);
}
