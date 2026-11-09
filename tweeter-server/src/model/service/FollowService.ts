// AI-assisted: see AI-ATTRIBUTION.md
import { FakeData, User } from "tweeter-shared";

export class FollowService {
  public async unfollow(_token: string, _userAlias: string): Promise<void> {
    // Milestone 3 simulates the operation; token lookup and persistence come later.
    await new Promise<void>((resolve) => setTimeout(resolve, 2000));
  }

  public async follow(_token: string, _userAlias: string): Promise<void> {
    // Milestone 3 simulates the operation; token lookup and persistence come later.
    await new Promise<void>((resolve) => setTimeout(resolve, 2000));
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
