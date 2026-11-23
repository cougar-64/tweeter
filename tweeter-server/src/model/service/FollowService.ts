// AI-assisted: see AI-ATTRIBUTION.md
import { FakeData, User } from "tweeter-shared";
import type { DAOFactory } from "../dao/DAOFactory";
import type { FollowDAO } from "../dao/FollowDAO";
import type { FollowCounts } from "../dao/DAOModels";
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
    return this.withFollowDAO(token, async (dao, actorAlias) => {
      if (actorAlias === targetAlias) throw new Error("[Bad Request] Users cannot follow themselves.");
      await dao[action](actorAlias, targetAlias);
    });
  }

  public getIsFollowerStatus(
    token: string,
    followerAlias: string,
    followeeAlias: string
  ): Promise<boolean> {
    return this.withFollowDAO(token, (dao) => dao.isFollowing(followerAlias, followeeAlias));
  }

  public getFolloweeCount(token: string, userAlias: string): Promise<number> {
    return this.getCount(token, userAlias, "followeeCount");
  }

  public getFollowerCount(token: string, userAlias: string): Promise<number> {
    return this.getCount(token, userAlias, "followerCount");
  }

  private getCount(token: string, userAlias: string, field: keyof FollowCounts): Promise<number> {
    return this.withFollowDAO(token, async (dao) => (await dao.getCounts(userAlias))[field]);
  }

  private async withFollowDAO<T>(token: string, operation: (dao: FollowDAO, actorAlias: string) => Promise<T>): Promise<T> {
    if (!this.factory || !this.authorization) throw new Error("Relationship dependencies are required.");
    const actorAlias = await this.authorization.authorize(token);
    return operation(this.factory.createFollowDAO(), actorAlias);
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
