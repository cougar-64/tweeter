// AI-assisted: see AI-ATTRIBUTION.md
import type { UserDto } from "./UserDto";

export interface StatusDto {
  readonly post: string;
  readonly user: UserDto;
  readonly timestamp: number;
  /** Assigned by the server for persisted posts; absent on new/legacy posts. */
  readonly statusId?: string;
}

export interface PersistedStatusDto extends StatusDto {
  readonly statusId: string;
}

export function isStatusId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value);
}

// Both sides of the API validate this nested JSON shape before reconstructing it.
export function isStatusDto(value: unknown): value is StatusDto {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const status = value as Partial<StatusDto>;
  const user = status.user;
  return (
    typeof status.post === "string" &&
    typeof status.timestamp === "number" && Number.isSafeInteger(status.timestamp) && status.timestamp >= 0 &&
    (status.statusId === undefined || isStatusId(status.statusId)) &&
    typeof user === "object" && user !== null && !Array.isArray(user) &&
    typeof user.firstName === "string" && typeof user.lastName === "string" &&
    typeof user.alias === "string" && user.alias.trim().length > 0 && typeof user.imageUrl === "string"
  );
}

export function isPersistedStatusDto(value: unknown): value is PersistedStatusDto {
  return isStatusDto(value) && isStatusId(value.statusId);
}
