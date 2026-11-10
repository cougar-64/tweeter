// AI-assisted: see AI-ATTRIBUTION.md
import type { UserDto } from "./UserDto";

export interface StatusDto {
  readonly post: string;
  readonly user: UserDto;
  readonly timestamp: number;
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
    typeof status.timestamp === "number" && Number.isFinite(status.timestamp) && status.timestamp >= 0 &&
    typeof user === "object" && user !== null && !Array.isArray(user) &&
    typeof user.firstName === "string" && typeof user.lastName === "string" &&
    typeof user.alias === "string" && user.alias.trim().length > 0 && typeof user.imageUrl === "string"
  );
}
