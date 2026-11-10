// AI-assisted: see AI-ATTRIBUTION.md
import type { PagedStatusItemRequest, Status } from "tweeter-shared";
import { StatusService } from "../../model/service/StatusService";
import { PagedStatusLambda } from "../PagedStatusLambda";

export class GetStoryLambda extends PagedStatusLambda {
  protected loadPage(request: PagedStatusItemRequest, lastItem: Status | null): Promise<[Status[], boolean]> {
    return new StatusService().loadMoreStoryItems(request.token, request.userAlias, request.pageSize, lastItem);
  }
}

export const handler = (request: unknown) => new GetStoryLambda().handle(request);
