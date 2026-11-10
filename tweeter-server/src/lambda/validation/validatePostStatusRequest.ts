// AI-assisted: see AI-ATTRIBUTION.md
import { isStatusDto } from "tweeter-shared";
import type { PostStatusRequest } from "tweeter-shared";
import { validateAuthenticatedRequest } from "./validateTweeterRequest";

export function validatePostStatusRequest(request: unknown): asserts request is PostStatusRequest {
  validateAuthenticatedRequest(request);
  if (!("status" in request) || !isStatusDto(request.status)) {
    throw new Error("[Bad Request] A valid status DTO is required.");
  }
  if (request.status.post.trim().length === 0) {
    throw new Error("[Bad Request] A nonempty post is required.");
  }
}
