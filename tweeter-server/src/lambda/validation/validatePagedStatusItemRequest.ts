// AI-assisted: see AI-ATTRIBUTION.md
import { isStatusDto } from "tweeter-shared";
import type { PagedStatusItemRequest } from "tweeter-shared";
import { validatePagedItemRequest } from "./validatePagedItemRequest";

export function validatePagedStatusItemRequest(request: unknown): asserts request is PagedStatusItemRequest {
  validatePagedItemRequest(request, isStatusDto, "status");
}
