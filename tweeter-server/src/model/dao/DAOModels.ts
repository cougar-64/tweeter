// AI-assisted: see AI-ATTRIBUTION.md
import type { StatusDto, UserDto } from "tweeter-shared";

/** Application cursors never contain database keys or SDK objects. */
export interface Page<T, Cursor> {
  readonly items: readonly T[];
  readonly nextCursor: Cursor | null;
}

export interface UserRecord {
  readonly profile: UserDto;
  readonly passwordHash: string;
  readonly followerCount: number;
  readonly followeeCount: number;
}

export interface FollowCounts {
  readonly followerCount: number;
  readonly followeeCount: number;
}

export interface SessionRecord {
  /** Store a digest of the bearer token, never the raw token. */
  readonly tokenHash: string;
  readonly userAlias: string;
  readonly lastActivity: number;
  /** All session times are whole Unix seconds, including the TTL attribute. */
  readonly expiresAt: number;
}

export interface StatusCursor {
  readonly timestamp: number;
  readonly statusId: string;
}

export interface StoredStatus extends StatusCursor {
  readonly status: StatusDto;
}

export interface UploadedImage {
  /** Opaque handle used to remove an upload if registration fails. */
  readonly imageId: string;
  readonly url: string;
}
