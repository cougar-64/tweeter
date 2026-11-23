// AI-assisted: see AI-ATTRIBUTION.md
import type { Page, StatusCursor, StoredStatus } from "./DAOModels";

export interface StoryDAO {
  /** Replaying the same immutable status (author, timestamp, ID) is idempotent. */
  putStatus(status: StoredStatus): Promise<void>;
  /** Newest first, ordered by timestamp and then status ID. */
  getStory(userAlias: string, pageSize: number, cursor: StatusCursor | null): Promise<Page<StoredStatus, StatusCursor>>;
}
