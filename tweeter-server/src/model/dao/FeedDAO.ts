// AI-assisted: see AI-ATTRIBUTION.md
import type { Page, StatusCursor, StoredStatus } from "./DAOModels";

export interface FeedDAO {
  /**
   * Persist a copy for each recipient. Repeated delivery is idempotent.
   * Implementations handle storage batch limits and retry transient failures;
   * reject if delivery remains incomplete rather than silently dropping entries.
   */
  putEntries(recipientAliases: readonly string[], status: StoredStatus): Promise<void>;
  /** Query persisted entries, newest first; never assemble a feed on read. */
  getFeed(userAlias: string, pageSize: number, cursor: StatusCursor | null): Promise<Page<StoredStatus, StatusCursor>>;
}
