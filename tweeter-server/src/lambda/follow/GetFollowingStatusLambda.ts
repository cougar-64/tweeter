// AI-assisted: see AI-ATTRIBUTION.md
import { FollowingStatusResponse } from "tweeter-shared";
import { FollowService } from "../../model/service/FollowService";
import { validateFollowingStatusRequest } from "../validation/validateFollowingStatusRequest";

export async function handler(request: unknown): Promise<FollowingStatusResponse> {
  validateFollowingStatusRequest(request);

  const isFollower = await new FollowService().getIsFollowerStatus(
    request.token, request.followerAlias, request.followeeAlias
  );
  return new FollowingStatusResponse(true, null, isFollower);
}
