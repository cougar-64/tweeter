// AI-assisted: see AI-ATTRIBUTION.md
import type { UserAliasRequest } from "tweeter-shared";
import type { FollowService } from "../../model/service/FollowService";
import { getFollowService } from "../config/getFollowService";
import { CountLambda } from "../CountLambda";

export abstract class FollowCountLambda extends CountLambda {
  protected abstract readonly countMethod: "getFollowerCount" | "getFolloweeCount";

  public constructor(private readonly service?: Pick<FollowService, "getFollowerCount" | "getFolloweeCount">) {
    super();
  }

  protected loadCount(request: UserAliasRequest): Promise<number> {
    return (this.service ?? getFollowService())[this.countMethod](request.token, request.userAlias);
  }
}
