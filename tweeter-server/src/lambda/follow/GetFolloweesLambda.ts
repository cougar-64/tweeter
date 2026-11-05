// AI-assisted: see AI-ATTRIBUTION.md
import type { PagedUserItemRequest, User } from "tweeter-shared";
import { FollowService } from "../../model/service/FollowService";
import { PagedUserLambda } from "../PagedUserLambda";

export class GetFolloweesLambda extends PagedUserLambda {
  protected loadPage(request: PagedUserItemRequest, lastItem: User | null): Promise<[User[], boolean]> {
    return new FollowService().loadMoreFollowees(
      request.token,
      request.userAlias,
      request.pageSize,
      lastItem
    );
  }
}

// AWS invokes this exported function, which starts the shared template method.
export const handler = (request: unknown) => new GetFolloweesLambda().handle(request);
