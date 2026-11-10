// AI-assisted: see AI-ATTRIBUTION.md
import { isStatusDto } from "tweeter-shared";
import type { PagedStatusItemRequest } from "tweeter-shared";
import { validateUserAliasRequest } from "./validateUserAliasRequest";

export function validatePagedStatusItemRequest(request: unknown): asserts request is PagedStatusItemRequest {
  validateUserAliasRequest(request);
  if (
    !("pageSize" in request) || typeof request.pageSize !== "number" ||
    !Number.isInteger(request.pageSize) || request.pageSize <= 0
  ) {
    throw new Error("[Bad Request] Page size must be a positive integer.");
  }
  if (!("lastItem" in request) || (request.lastItem !== null && !isStatusDto(request.lastItem))) {
    throw new Error("[Bad Request] Last item must be a status DTO or null.");
  }
}
