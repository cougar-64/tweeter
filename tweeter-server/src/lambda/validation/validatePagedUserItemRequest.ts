// AI-assisted: see AI-ATTRIBUTION.md
import { isUserDto } from "tweeter-shared";
import type { PagedUserItemRequest } from "tweeter-shared";
import { validatePagedItemRequest } from "./validatePagedItemRequest";

export function validatePagedUserItemRequest(request: unknown): asserts request is PagedUserItemRequest {
  validatePagedItemRequest(request, isUserDto, "user");
}
