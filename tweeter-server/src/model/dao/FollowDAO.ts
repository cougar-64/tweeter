// AI-assisted: see AI-ATTRIBUTION.md
import type { FollowCounts, Page } from "./DAOModels";

export interface FollowDAO {
  /** Both users must exist. Update the relationship and both counts atomically. */
  follow(followerAlias: string, followeeAlias: string): Promise<void>;
  /** Repeated changes are idempotent and never corrupt counts. */
  unfollow(followerAlias: string, followeeAlias: string): Promise<void>;
  isFollowing(followerAlias: string, followeeAlias: string): Promise<boolean>;
  getCounts(userAlias: string): Promise<FollowCounts>;
  /** Return aliases in ascending order; the cursor is the last returned alias. */
  getFollowers(userAlias: string, pageSize: number, cursor: string | null): Promise<Page<string, string>>;
  getFollowees(userAlias: string, pageSize: number, cursor: string | null): Promise<Page<string, string>>;
}
