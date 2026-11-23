// AI-assisted: see AI-ATTRIBUTION.md
import type { PagedStatusItemRequest, Status } from "tweeter-shared";
import type { StatusService } from "../../model/service/StatusService";
import { getStatusService } from "../config/getStatusService";
import { PagedStatusLambda } from "../PagedStatusLambda";

type StatusPageMethod = "loadMoreStoryItems" | "loadMoreFeedItems";

export abstract class StatusPageLambda<Method extends StatusPageMethod> extends PagedStatusLambda {
  protected abstract readonly pageMethod: Method;

  public constructor(private readonly service?: Pick<StatusService, Method>) {
    super();
  }

  protected loadPage(request: PagedStatusItemRequest, lastItem: Status | null): Promise<[Status[], boolean]> {
    return (this.service ?? getStatusService())[this.pageMethod](
      request.token, request.userAlias, request.pageSize, lastItem
    );
  }
}
