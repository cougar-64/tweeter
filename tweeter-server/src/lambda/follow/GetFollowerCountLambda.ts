// AI-assisted: see AI-ATTRIBUTION.md
import { CountResponse } from "tweeter-shared";
import { FollowService } from "../../model/service/FollowService";
import { validateUserAliasRequest } from "../validation/validateUserAliasRequest";

export async function handler(request: unknown): Promise<CountResponse> {
  validateUserAliasRequest(request);

  const count = await new FollowService().getFollowerCount(request.token, request.userAlias);
  return new CountResponse(true, null, count);
}
