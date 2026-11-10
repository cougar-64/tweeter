// AI-assisted: see AI-ATTRIBUTION.md
import type { PagedStatusItemRequest, Status } from "tweeter-shared";
import { StatusService } from "../../model/service/StatusService";
import { PagedStatusLambda } from "../PagedStatusLambda";

export class GetFeedLambda extends PagedStatusLambda {
  protected loadPage(request: PagedStatusItemRequest, lastItem: Status | null): Promise<[Status[], boolean]> {
    return new StatusService().loadMoreFeedItems(request.token, request.userAlias, request.pageSize, lastItem);
  }
}

export const handler = (request: unknown) => new GetFeedLambda().handle(request);
