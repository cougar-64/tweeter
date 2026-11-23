// AI-assisted: see AI-ATTRIBUTION.md
import type { PagedUserItemRequest, User } from "tweeter-shared";
import type { FollowService } from "../../model/service/FollowService";
import { getFollowService } from "../config/getFollowService";
import { PagedUserLambda } from "../PagedUserLambda";

export abstract class FollowPageLambda extends PagedUserLambda {
  protected abstract readonly pageMethod: "loadMoreFollowers" | "loadMoreFollowees";

  public constructor(private readonly service?: Pick<FollowService, "loadMoreFollowers" | "loadMoreFollowees">) {
    super();
  }

  protected loadPage(request: PagedUserItemRequest, lastItem: User | null): Promise<[User[], boolean]> {
    return (this.service ?? getFollowService())[this.pageMethod](
      request.token, request.userAlias, request.pageSize, lastItem
    );
  }
}
