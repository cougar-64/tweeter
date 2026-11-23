// AI-assisted: see AI-ATTRIBUTION.md
import { FakeData, User } from "tweeter-shared";
import type { DAOFactory } from "../dao/DAOFactory";
import type { AuthorizationService } from "./AuthorizationService";

export class FollowService {
  public constructor(
    private readonly factory?: Pick<DAOFactory, "createFollowDAO">,
    private readonly authorization?: Pick<AuthorizationService, "authorize">
  ) {}

  public unfollow(token: string, userAlias: string): Promise<void> {
    return this.changeRelationship(token, userAlias, "unfollow");
  }

  public follow(token: string, userAlias: string): Promise<void> {
    return this.changeRelationship(token, userAlias, "follow");
  }

  private async changeRelationship(token: string, targetAlias: string, action: "follow" | "unfollow"): Promise<void> {
    if (!this.factory || !this.authorization) throw new Error("Relationship dependencies are required.");
    const actorAlias = await this.authorization.authorize(token);
    if (actorAlias === targetAlias) throw new Error("[Bad Request] Users cannot follow themselves.");
    await this.factory.createFollowDAO()[action](actorAlias, targetAlias);
  }

  public async getIsFollowerStatus(
    _token: string,
    _followerAlias: string,
    _followeeAlias: string
  ): Promise<boolean> {
    // FakeData randomizes this result; the aliases identify the future relationship lookup.
    return FakeData.instance.isFollower();
  }

  public async getFolloweeCount(_token: string, userAlias: string): Promise<number> {
    return FakeData.instance.getFolloweeCount(userAlias);
  }

  public async getFollowerCount(_token: string, userAlias: string): Promise<number> {
    return FakeData.instance.getFollowerCount(userAlias);
  }

  public async loadMoreFollowees(
    // Milestone 3 uses dummy data; token verification comes in a later milestone.
    _token: string,
    userAlias: string,
    pageSize: number,
    lastItem: User | null
  ): Promise<[User[], boolean]> {
    return FakeData.instance.getPageOfUsers(lastItem, pageSize, userAlias);
  }

  public async loadMoreFollowers(
    // Milestone 3 uses dummy data; token verification comes in a later milestone.
    _token: string,
    userAlias: string,
    pageSize: number,
    lastItem: User | null
  ): Promise<[User[], boolean]> {
    return FakeData.instance.getPageOfUsers(lastItem, pageSize, userAlias);
  }
}
