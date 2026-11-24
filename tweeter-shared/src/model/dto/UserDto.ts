// AI-assisted: see AI-ATTRIBUTION.md
export interface UserDto {
  firstName: string;
  lastName: string;
  alias: string;
  imageUrl: string;
}

/** Shared guard for user cursors and the nested author on a status DTO. */
export function isUserDto(value: unknown): value is UserDto {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const user = value as Partial<UserDto>;
  return (
    typeof user.firstName === "string" && typeof user.lastName === "string" &&
    typeof user.alias === "string" && user.alias.trim().length > 0 && typeof user.imageUrl === "string"
  );
}
