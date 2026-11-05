// AI-assisted: see AI-ATTRIBUTION.md
import type { PagedUserItemRequest, UserDto } from "tweeter-shared";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUserDto(value: unknown): value is UserDto {
  return (
    isRecord(value) &&
    typeof value.firstName === "string" &&
    typeof value.lastName === "string" &&
    typeof value.alias === "string" &&
    value.alias.trim().length > 0 &&
    typeof value.imageUrl === "string"
  );
}

export function validatePagedUserItemRequest(request: unknown): asserts request is PagedUserItemRequest {
  if (!isRecord(request)) {
    throw new Error("[Bad Request] A request object is required.");
  }
  if (typeof request.token !== "string" || request.token.trim().length === 0) {
    throw new Error("[Bad Request] A token is required.");
  }
  if (typeof request.userAlias !== "string" || request.userAlias.trim().length === 0) {
    throw new Error("[Bad Request] A user alias is required.");
  }
  if (
    typeof request.pageSize !== "number" ||
    !Number.isInteger(request.pageSize) ||
    request.pageSize <= 0
  ) {
    throw new Error("[Bad Request] Page size must be a positive integer.");
  }
  if (request.lastItem !== null && !isUserDto(request.lastItem)) {
    throw new Error("[Bad Request] Last item must be a user DTO or null.");
  }
}
