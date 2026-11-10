// AI-assisted: see AI-ATTRIBUTION.md
import type { AuthenticatedRequest, TweeterRequest } from "tweeter-shared";

export function validateTweeterRequest(request: unknown): asserts request is TweeterRequest {
  if (typeof request !== "object" || request === null || Array.isArray(request)) {
    throw new Error("[Bad Request] A request object is required.");
  }
}

export function validateAuthenticatedRequest(request: unknown): asserts request is AuthenticatedRequest {
  validateTweeterRequest(request);
  if (!("token" in request) || typeof request.token !== "string" || request.token.trim().length === 0) {
    throw new Error("[Bad Request] A token is required.");
  }
}
