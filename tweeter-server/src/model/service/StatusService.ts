// AI-assisted: see AI-ATTRIBUTION.md
import { FakeData, Status } from "tweeter-shared";

export class StatusService {
  public async postStatus(_token: string, _status: Status): Promise<void> {
    // Milestone 3 simulates posting; persistence and feed updates come later.
    await new Promise<void>((resolve) => setTimeout(resolve, 2000));
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
