// AI-assisted: see AI-ATTRIBUTION.md
import type { SessionRecord } from "./DAOModels";

export interface SessionDAO {
  /** Never replace an existing session with the same digest. */
  createSession(session: SessionRecord): Promise<void>;
  /**
   * Atomically refresh only an existing session with expiresAt > now.
   * Return null for expired, missing, or revoked sessions; never recreate them.
   * Concurrent activity must not move lastActivity or expiresAt backward.
   * Times and inactivitySeconds are expressed in whole seconds.
   */
  refreshSession(tokenHash: string, now: number, inactivitySeconds: number): Promise<SessionRecord | null>;
  /** Idempotent; deletion must not permit a concurrent refresh to recreate it. */
  deleteSession(tokenHash: string): Promise<void>;
}
