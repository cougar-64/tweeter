// AI-assisted: see AI-ATTRIBUTION.md
import type { TweeterRequest } from "tweeter-shared";

export function validateTweeterRequest(request: unknown): asserts request is TweeterRequest {
  if (typeof request !== "object" || request === null || Array.isArray(request)) {
    throw new Error("[Bad Request] A request object is required.");
  }
  if (!("token" in request) || typeof request.token !== "string" || request.token.trim().length === 0) {
    throw new Error("[Bad Request] A token is required.");
  }
}
