// AI-assisted: see AI-ATTRIBUTION.md
import { FakeData, Status, User } from "tweeter-shared";
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

  public async loadMoreFeedItems(
    _token: string,
    _userAlias: string,
    pageSize: number,
    lastItem: Status | null
  ): Promise<[Status[], boolean]> {
    // Preserve the shared dummy list; followee-based filtering comes with real storage.
    return FakeData.instance.getPageOfStatuses(lastItem, pageSize);
  }

  public async loadMoreStoryItems(
    _token: string,
    _userAlias: string,
    pageSize: number,
    lastItem: Status | null
  ): Promise<[Status[], boolean]> {
    // Preserve the shared dummy status list; alias filtering comes with real storage.
    return FakeData.instance.getPageOfStatuses(lastItem, pageSize);
  }
}
