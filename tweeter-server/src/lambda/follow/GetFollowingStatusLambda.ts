// AI-assisted: see AI-ATTRIBUTION.md
import { FollowingStatusResponse } from "tweeter-shared";
import type { FollowService } from "../../model/service/FollowService";
import { getFollowService } from "../config/getFollowService";
import { validateFollowingStatusRequest } from "../validation/validateFollowingStatusRequest";

export class GetFollowingStatusLambda {
  public constructor(private readonly service?: Pick<FollowService, "getIsFollowerStatus">) {}

  public async handle(request: unknown): Promise<FollowingStatusResponse> {
    validateFollowingStatusRequest(request);
    const isFollower = await (this.service ?? getFollowService()).getIsFollowerStatus(
      request.token, request.followerAlias, request.followeeAlias
    );
    return new FollowingStatusResponse(true, null, isFollower);
  }
}

export const handler = (request: unknown) => new GetFollowingStatusLambda().handle(request);
