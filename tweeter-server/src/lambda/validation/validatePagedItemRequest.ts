// AI-assisted: see AI-ATTRIBUTION.md
import type { UserAliasRequest } from "tweeter-shared";
import { validateUserAliasRequest } from "./validateUserAliasRequest";

type PagedItemRequest<T> = UserAliasRequest & { readonly pageSize: number; readonly lastItem: T | null };

/** Share page validation while each endpoint supplies its cursor shape. */
export function validatePagedItemRequest<T>(
  request: unknown,
  isItem: (value: unknown) => value is T,
  itemLabel: "user" | "status"
): asserts request is PagedItemRequest<T> {
  validateUserAliasRequest(request);
  if (
    !("pageSize" in request) || typeof request.pageSize !== "number" ||
    !Number.isInteger(request.pageSize) || request.pageSize <= 0
  ) {
    throw new Error("[Bad Request] Page size must be a positive integer.");
  }
  if (!("lastItem" in request) || (request.lastItem !== null && !isItem(request.lastItem))) {
    throw new Error(`[Bad Request] Last item must be a ${itemLabel} DTO or null.`);
  }
}
