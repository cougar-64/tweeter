// AI-assisted: see AI-ATTRIBUTION.md
import type { UserAliasRequest } from "tweeter-shared";
import { FollowService } from "../../model/service/FollowService";
import { CountLambda } from "../CountLambda";

export class GetFolloweeCountLambda extends CountLambda {
  protected loadCount(request: UserAliasRequest): Promise<number> {
    return new FollowService().getFolloweeCount(request.token, request.userAlias);
  }
}

export const handler = (request: unknown) => new GetFolloweeCountLambda().handle(request);
