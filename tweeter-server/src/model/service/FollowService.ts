// AI-assisted: see AI-ATTRIBUTION.md
import { FakeData, User } from "tweeter-shared";

export class FollowService {
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
