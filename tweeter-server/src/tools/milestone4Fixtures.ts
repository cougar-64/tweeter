// AI-assisted: see AI-ATTRIBUTION.md
import type { UserDto } from "tweeter-shared";
import type { StoredStatus } from "../model/dao/DAOModels";

export const fixtureImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNQaLgAAAI0AXFUk8N2AAAAAElFTkSuQmCC";

export function buildMilestone4Fixtures(namespace: string, imageUrl: string) {
  if (!/^[a-z0-9]{6,24}$/.test(namespace)) throw new Error("Fixture namespace must be 6-24 lowercase letters/digits.");
  const profile = (suffix: string, firstName: string): UserDto => ({
    alias: `@${namespace}-${suffix}`, firstName, lastName: "Fixture", imageUrl,
  });
  const users = {
    reader: profile("reader", "Reader"), authorA: profile("author-a", "Alice"),
    authorB: profile("author-b", "Bob"), empty: profile("empty", "Empty"),
  };
  const story = (author: UserDto, suffix: string): StoredStatus[] => Array.from({ length: 13 }, (_, i) => {
    // Ties exercise the ID part of the cursor; both authors share timestamps.
    const timestamp = 1700000000000 + Math.floor(i / 4);
    const statusId = `${namespace}-${suffix}-${String(i).padStart(2, "0")}`;
    return { timestamp, statusId, status: {
      timestamp, statusId, user: author,
      post: `Fixture ${suffix} ${i}: hello ${users.reader.alias} https://example.com\nPagination check.`,
    } };
  });
  const newestFirst = (a: StoredStatus, b: StoredStatus) =>
    b.timestamp - a.timestamp || (a.statusId < b.statusId ? 1 : a.statusId > b.statusId ? -1 : 0);
  const stories = { authorA: story(users.authorA, "a").sort(newestFirst), authorB: story(users.authorB, "b").sort(newestFirst) };
  return {
    version: 1 as const, namespace, imageUrl, users, stories,
    feed: [...stories.authorA, ...stories.authorB].sort(newestFirst),
  };
}

export type Milestone4Fixtures = ReturnType<typeof buildMilestone4Fixtures>;
