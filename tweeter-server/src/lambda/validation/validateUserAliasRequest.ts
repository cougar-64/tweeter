// AI-assisted: see AI-ATTRIBUTION.md
import type { UserAliasRequest } from "tweeter-shared";

export function validateUserAliasRequest(request: unknown): asserts request is UserAliasRequest {
  if (typeof request !== "object" || request === null || Array.isArray(request)) {
    throw new Error("[Bad Request] A request object is required.");
  }
  const fields = request as Partial<UserAliasRequest>;
  if (typeof fields.token !== "string" || fields.token.trim().length === 0) {
    throw new Error("[Bad Request] A token is required.");
  }
  if (typeof fields.userAlias !== "string" || fields.userAlias.trim().length === 0) {
    throw new Error("[Bad Request] A user alias is required.");
  }
}
