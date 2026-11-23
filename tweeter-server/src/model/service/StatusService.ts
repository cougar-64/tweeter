// AI-assisted: see AI-ATTRIBUTION.md
import { Status, User, isStatusId } from "tweeter-shared";
import { randomUUID } from "node:crypto";
import type { DAOFactory } from "../dao/DAOFactory";
import type { Page, StoredStatus } from "../dao/DAOModels";
import type { AuthorizationService } from "./AuthorizationService";

export class StatusService {
  private static readonly followerPageSize = 100;

  public constructor(
    private readonly factory?: Pick<DAOFactory, "createUserDAO" | "createStoryDAO" | "createFeedDAO" | "createFollowDAO">,
    private readonly authorization?: Pick<AuthorizationService, "authorize">
  ) {}

  public async postStatus(token: string, status: Status): Promise<void> {
    if (!this.factory || !this.authorization) throw new Error("Status dependencies are required.");
    const actorAlias = await this.authorization.authorize(token);
    if (status.post.trim().length === 0) throw new Error("[Bad Request] A nonempty post is required.");
    const author = await this.factory.createUserDAO().getUser(actorAlias);
    if (author === null) throw new Error("[Unauthorized] Invalid or expired authentication token.");

    // Only the text comes from the client; identity, profile, time, and ID are
    // authoritative server data. Preserve this one snapshot throughout delivery.
    const statusId = randomUUID();
    const timestamp = Date.now();
    const record: StoredStatus = {
      statusId, timestamp,
      status: { post: status.post, user: User.fromDto(author.profile).dto, timestamp, statusId },
    };
    await this.factory.createStoryDAO().putStatus(record);

    const follows = this.factory.createFollowDAO();
    const feed = this.factory.createFeedDAO();
    let cursor: string | null = null;
    do {
      const page: Page<string, string> = await follows.getFollowers(actorAlias, StatusService.followerPageSize, cursor);
      if (page.nextCursor !== null && page.nextCursor === cursor) throw new Error("Follower pagination did not advance.");
      if (page.items.length > 0) await feed.putEntries(page.items, record);
      cursor = page.nextCursor;
    } while (cursor !== null);
    // Success means every requested feed write completed. Failures propagate;
    // an already-saved story or partially delivered feed is not rolled back.
  }

  public loadMoreFeedItems(
    token: string,
    userAlias: string,
    pageSize: number,
    lastItem: Status | null
  ): Promise<[Status[], boolean]> {
    return this.loadStatuses(token, userAlias, pageSize, lastItem, "feed");
  }

  public loadMoreStoryItems(
    token: string,
    userAlias: string,
    pageSize: number,
    lastItem: Status | null
  ): Promise<[Status[], boolean]> {
    return this.loadStatuses(token, userAlias, pageSize, lastItem, "story");
  }

  private async loadStatuses(token: string, userAlias: string, pageSize: number,
    lastItem: Status | null, source: "story" | "feed"): Promise<[Status[], boolean]> {
    if (!this.factory || !this.authorization) throw new Error("Status dependencies are required.");
    await this.authorization.authorize(token);
    // Both lists need timestamp/ID identity. Only stories require the cursor's
    // author to match the owner: a feed contains snapshots from many authors.
    if (lastItem !== null) {
      const invalidIdentity = !isStatusId(lastItem.statusId) ||
        !Number.isSafeInteger(lastItem.timestamp) || lastItem.timestamp < 0;
      if (source === "story" && (invalidIdentity || lastItem.user.alias !== userAlias)) {
        throw new Error("[Bad Request] A story cursor must identify a persisted status by the requested author.");
      }
      if (invalidIdentity) throw new Error("[Bad Request] A feed cursor must identify a persisted status.");
    }
    if (await this.factory.createUserDAO().getUser(userAlias) === null) throw new Error("[Bad Request] User not found.");
    const cursor = lastItem === null ? null : { timestamp: lastItem.timestamp, statusId: lastItem.statusId! };
    const page = source === "story"
      ? await this.factory.createStoryDAO().getStory(userAlias, pageSize, cursor)
      : await this.factory.createFeedDAO().getFeed(userAlias, pageSize, cursor);
    return [page.items.map((record) => Status.fromDto(record.status)), page.nextCursor !== null];
  }
}
