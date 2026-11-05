// AI-assisted: see AI-ATTRIBUTION.md
import type { UserAliasRequest } from "tweeter-shared";
import { FollowService } from "../../model/service/FollowService";
import { CountLambda } from "../CountLambda";

export class GetFollowerCountLambda extends CountLambda {
  protected loadCount(request: UserAliasRequest): Promise<number> {
    return new FollowService().getFollowerCount(request.token, request.userAlias);
  }
}

export const handler = (request: unknown) => new GetFollowerCountLambda().handle(request);
