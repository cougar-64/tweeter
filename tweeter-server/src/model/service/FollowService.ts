// AI-assisted: see AI-ATTRIBUTION.md
import { User } from "tweeter-shared";
import type { DAOFactory } from "../dao/DAOFactory";
import type { FollowDAO } from "../dao/FollowDAO";
import type { FollowCounts } from "../dao/DAOModels";
import type { AuthorizationService } from "./AuthorizationService";

type FollowServiceFactory = Pick<DAOFactory, "createFollowDAO" | "createUserDAO">;

export class FollowService {
  public constructor(
    private readonly factory?: FollowServiceFactory,
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

  private async withFollowDAO<T>(token: string, operation: (dao: FollowDAO, actorAlias: string, factory: FollowServiceFactory) => Promise<T>): Promise<T> {
    if (!this.factory || !this.authorization) throw new Error("Relationship dependencies are required.");
    const actorAlias = await this.authorization.authorize(token);
    return operation(this.factory.createFollowDAO(), actorAlias, this.factory);
  }

  public loadMoreFollowees(
    token: string,
    userAlias: string,
    pageSize: number,
    lastItem: User | null
  ): Promise<[User[], boolean]> {
    return this.loadUsers(token, userAlias, pageSize, lastItem, "getFollowees");
  }

  public loadMoreFollowers(
    token: string,
    userAlias: string,
    pageSize: number,
    lastItem: User | null
  ): Promise<[User[], boolean]> {
    return this.loadUsers(token, userAlias, pageSize, lastItem, "getFollowers");
  }

  private loadUsers(token: string, userAlias: string, pageSize: number, lastItem: User | null,
    method: "getFollowers" | "getFollowees"): Promise<[User[], boolean]> {
    return this.withFollowDAO(token, async (dao, _actor, factory) => {
      const users = factory.createUserDAO();
      if (await users.getUser(userAlias) === null) throw new Error("[Bad Request] User not found.");
      const page = await dao[method](userAlias, pageSize, lastItem?.alias ?? null);
      // Promise.all preserves the DAO's alias order even if profile reads finish
      // out of order. Never expose the credential fields returned by UserDAO.
      const profiles = await Promise.all(page.items.map(async (alias) => {
        const record = await users.getUser(alias);
        if (record === null) throw new Error("A related user profile is missing.");
        return User.fromDto(record.profile);
      }));
      // Missing profiles are errors rather than skipped rows, which could lose
      // the last returned cursor or incorrectly terminate infinite scrolling.
      return [profiles, page.nextCursor !== null];
    });
  }
}
