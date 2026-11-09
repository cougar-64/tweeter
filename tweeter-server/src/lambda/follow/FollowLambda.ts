// AI-assisted: see AI-ATTRIBUTION.md
import { TweeterResponse } from "tweeter-shared";
import { FollowService } from "../../model/service/FollowService";
import { validateUserAliasRequest } from "../validation/validateUserAliasRequest";

export async function handler(request: unknown): Promise<TweeterResponse> {
  validateUserAliasRequest(request);

  await new FollowService().follow(request.token, request.userAlias);
  return new TweeterResponse(true);
}
