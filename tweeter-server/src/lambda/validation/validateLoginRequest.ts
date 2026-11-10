// AI-assisted: see AI-ATTRIBUTION.md
import type { LoginRequest } from "tweeter-shared";
import { validateTweeterRequest } from "./validateTweeterRequest";

export function validateLoginRequest(request: unknown): asserts request is LoginRequest {
  validateTweeterRequest(request);
  if (!("alias" in request) || typeof request.alias !== "string" || request.alias.trim().length === 0) {
    throw new Error("[Bad Request] An alias is required.");
  }
  if (!("password" in request) || typeof request.password !== "string" || request.password.trim().length === 0) {
    throw new Error("[Bad Request] A password is required.");
  }
}
