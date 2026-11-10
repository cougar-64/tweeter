// AI-assisted: see AI-ATTRIBUTION.md
import type { FollowingStatusRequest } from "tweeter-shared";
import { validateAuthenticatedRequest } from "./validateTweeterRequest";

export function validateFollowingStatusRequest(request: unknown): asserts request is FollowingStatusRequest {
  validateAuthenticatedRequest(request);
  if (
    !("followerAlias" in request) ||
    typeof request.followerAlias !== "string" ||
    request.followerAlias.trim().length === 0
  ) {
    throw new Error("[Bad Request] A follower alias is required.");
  }
  if (
    !("followeeAlias" in request) ||
    typeof request.followeeAlias !== "string" ||
    request.followeeAlias.trim().length === 0
  ) {
    throw new Error("[Bad Request] A followee alias is required.");
  }
}
