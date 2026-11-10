// AI-assisted: see AI-ATTRIBUTION.md
import { Status, TweeterResponse } from "tweeter-shared";
import { StatusService } from "../../model/service/StatusService";
import { validatePostStatusRequest } from "../validation/validatePostStatusRequest";

export async function handler(request: unknown): Promise<TweeterResponse> {
  validatePostStatusRequest(request);

  await new StatusService().postStatus(request.token, Status.fromDto(request.status));
  return new TweeterResponse(true);
}
