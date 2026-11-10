// AI-assisted: see AI-ATTRIBUTION.md
import { FakeData, Status } from "tweeter-shared";

export class StatusService {
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
