// AI-assisted: see AI-ATTRIBUTION.md
import type { PagedStatusItemRequest, Status } from "tweeter-shared";
import type { StatusService } from "../../model/service/StatusService";
import { getStatusService } from "../config/getStatusService";
import { PagedStatusLambda } from "../PagedStatusLambda";

export class GetStoryLambda extends PagedStatusLambda {
  public constructor(private readonly service?: Pick<StatusService, "loadMoreStoryItems">) {
    super();
  }

  protected loadPage(request: PagedStatusItemRequest, lastItem: Status | null): Promise<[Status[], boolean]> {
    return (this.service ?? getStatusService()).loadMoreStoryItems(request.token, request.userAlias, request.pageSize, lastItem);
  }
}

export const handler = (request: unknown) => new GetStoryLambda().handle(request);
