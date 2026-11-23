// AI-assisted: see AI-ATTRIBUTION.md
import type { UserAliasRequest } from "tweeter-shared";
import type { FollowService } from "../../model/service/FollowService";
import { getFollowService } from "../config/getFollowService";
import { UserActionLambda } from "../UserActionLambda";

/** Shares service resolution and delegation for relationship mutations. */
export abstract class FollowActionLambda extends UserActionLambda {
  protected abstract readonly action: "follow" | "unfollow";

  public constructor(private readonly service?: Pick<FollowService, "follow" | "unfollow">) {
    super();
  }

  protected performAction(request: UserAliasRequest): Promise<void> {
    return (this.service ?? getFollowService())[this.action](request.token, request.userAlias);
  }
}
