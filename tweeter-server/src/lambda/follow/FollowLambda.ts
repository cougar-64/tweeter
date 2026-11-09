// AI-assisted: see AI-ATTRIBUTION.md
import type { UserAliasRequest } from "tweeter-shared";
import { FollowService } from "../../model/service/FollowService";
import { UserActionLambda } from "../UserActionLambda";

export class FollowLambda extends UserActionLambda {
  protected performAction(request: UserAliasRequest): Promise<void> {
    return new FollowService().follow(request.token, request.userAlias);
  }
}

export const handler = (request: unknown) => new FollowLambda().handle(request);
