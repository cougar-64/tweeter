// AI-assisted: see AI-ATTRIBUTION.md
import { PagedStatusItemResponse, Status } from "tweeter-shared";
import type { PagedStatusItemRequest } from "tweeter-shared";
import { validatePagedStatusItemRequest } from "./validation/validatePagedStatusItemRequest";

export abstract class PagedStatusLambda {
  public async handle(request: unknown): Promise<PagedStatusItemResponse> {
    validatePagedStatusItemRequest(request);
    const lastItem = request.lastItem === null ? null : Status.fromDto(request.lastItem);
    const [statuses, hasMore] = await this.loadPage(request, lastItem);
    return new PagedStatusItemResponse(true, null, statuses.map((status) => status.dto), hasMore);
  }

  protected abstract loadPage(request: PagedStatusItemRequest, lastItem: Status | null): Promise<[Status[], boolean]>;
}
