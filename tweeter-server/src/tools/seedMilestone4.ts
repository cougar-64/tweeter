// AI-assisted: see AI-ATTRIBUTION.md
import { setTimeout as delay } from "node:timers/promises";
import { randomUUID } from "node:crypto";
import type { DAOFactory } from "../model/dao/DAOFactory";
import { buildMilestone4Fixtures, fixtureUsers, type Milestone4Fixtures } from "./milestone4Fixtures";

/** All reserved fixture aliases must be absent. Never replace accounts implicitly. */
export async function seedMilestone4(
  factory: DAOFactory,
  namespace: string,
  hashPassword: () => Promise<string>,
  imageBytes: Uint8Array,
  pause: (milliseconds: number) => Promise<void> = (milliseconds) => delay(milliseconds)
): Promise<Milestone4Fixtures> {
  const plan = buildMilestone4Fixtures(namespace, "pending-upload");
  const users = factory.createUserDAO();
  for (const user of fixtureUsers(plan)) {
    if (await users.getUser(user.alias) !== null) throw new Error(`Fixture alias already exists: ${user.alias}. Use a new namespace.`);
    await pause(120);
  }
  const image = await factory.createImageDAO().putImage(`${namespace}-${randomUUID()}.png`, imageBytes, "image/png");
  const fixtures = buildMilestone4Fixtures(namespace, image.url);
  for (const user of fixtureUsers(fixtures)) {
    if (!await users.createUser(user, await hashPassword())) throw new Error(`Fixture alias was concurrently created: ${user.alias}.`);
  }
  const follows = factory.createFollowDAO();
  for (const edge of fixtures.relationships) {
    await follows.follow(edge.followerAlias, edge.followeeAlias);
    // Transactions charge both user-counter updates; avoid a burst during seeding.
    await pause(1100);
  }
  const stories = factory.createStoryDAO();
  const feeds = factory.createFeedDAO();
  // Seed explicit snapshots so this does not depend on reverse-index propagation.
  // API posting/fan-out will need separate live mutation verification.
  for (const record of Object.values(fixtures.stories).flat()) {
    await stories.putStatus(record);
    const recipients = fixtures.relationships.filter((edge) => edge.followeeAlias === record.status.user.alias)
      .map((edge) => edge.followerAlias);
    // Smooth administrative load with small recipient groups; FeedDAO still
    // owns database batch limits/retries. Normal service operations are unaffected.
    for (let offset = 0; offset < recipients.length; offset += 4) {
      const group = recipients.slice(offset, offset + 4);
      await feeds.putEntries(group, record);
      await pause(Math.max(600, group.length * 250));
    }
    if (recipients.length === 0) await pause(600);
  }
  return fixtures;
}
