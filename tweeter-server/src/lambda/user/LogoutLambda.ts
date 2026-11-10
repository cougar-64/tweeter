// AI-assisted: see AI-ATTRIBUTION.md
import { TweeterResponse } from "tweeter-shared";
import { UserService } from "../../model/service/UserService";
import { validateAuthenticatedRequest } from "../validation/validateTweeterRequest";

export async function handler(request: unknown): Promise<TweeterResponse> {
  validateAuthenticatedRequest(request);

  await new UserService().logout(request.token);
  return new TweeterResponse(true);
}
