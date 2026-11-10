// AI-assisted: see AI-ATTRIBUTION.md
import type { UserAliasRequest } from "tweeter-shared";
import { validateAuthenticatedRequest } from "./validateTweeterRequest";

export function validateUserAliasRequest(request: unknown): asserts request is UserAliasRequest {
  validateAuthenticatedRequest(request);
  if (!("userAlias" in request) || typeof request.userAlias !== "string" || request.userAlias.trim().length === 0) {
    throw new Error("[Bad Request] A user alias is required.");
  }
}
