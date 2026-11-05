// AI-assisted: see AI-ATTRIBUTION.md
import type { PagedUserItemRequest, UserDto } from "tweeter-shared";
import { validateUserAliasRequest } from "./validateUserAliasRequest";

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
  validateUserAliasRequest(request);
  if (
    !("pageSize" in request) ||
    typeof request.pageSize !== "number" ||
    !Number.isInteger(request.pageSize) ||
    request.pageSize <= 0
  ) {
    throw new Error("[Bad Request] Page size must be a positive integer.");
  }
  if (!("lastItem" in request) || (request.lastItem !== null && !isUserDto(request.lastItem))) {
    throw new Error("[Bad Request] Last item must be a user DTO or null.");
  }
}
