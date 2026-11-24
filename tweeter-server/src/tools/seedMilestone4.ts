// AI-assisted: see AI-ATTRIBUTION.md
import { randomUUID } from "node:crypto";
import type { DAOFactory } from "../model/dao/DAOFactory";
import { buildMilestone4Fixtures, type Milestone4Fixtures } from "./milestone4Fixtures";

/** Fresh namespaces only. No resets, credential replacements, or table scans. */
export async function seedMilestone4(
  factory: DAOFactory,
  namespace: string,
  hashPassword: () => Promise<string>,
  imageBytes: Uint8Array
): Promise<Milestone4Fixtures> {
  const plan = buildMilestone4Fixtures(namespace, "pending-upload");
  const users = factory.createUserDAO();
  for (const user of Object.values(plan.users)) {
    if (await users.getUser(user.alias) !== null) throw new Error(`Fixture alias already exists: ${user.alias}. Use a new namespace.`);
  }
  const image = await factory.createImageDAO().putImage(`${namespace}-${randomUUID()}.png`, imageBytes, "image/png");
  const fixtures = buildMilestone4Fixtures(namespace, image.url);
  for (const user of Object.values(fixtures.users)) {
    if (!await users.createUser(user, await hashPassword())) throw new Error(`Fixture alias was concurrently created: ${user.alias}.`);
  }
  const follows = factory.createFollowDAO();
  await follows.follow(fixtures.users.reader.alias, fixtures.users.authorA.alias);
  await follows.follow(fixtures.users.reader.alias, fixtures.users.authorB.alias);
  const stories = factory.createStoryDAO();
  const feeds = factory.createFeedDAO();
  // Seed explicit snapshots so this does not depend on reverse-index propagation.
  // API posting/fan-out will need separate live mutation verification.
  for (const record of fixtures.feed) {
    await stories.putStatus(record);
    await feeds.putEntries([fixtures.users.reader.alias], record);
  }
  return fixtures;
}
