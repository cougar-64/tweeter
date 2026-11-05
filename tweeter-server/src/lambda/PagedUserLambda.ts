// AI-assisted: see AI-ATTRIBUTION.md
import { PagedUserItemResponse, User } from "tweeter-shared";
import type { PagedUserItemRequest } from "tweeter-shared";
import { validatePagedUserItemRequest } from "./validation/validatePagedUserItemRequest";

export abstract class PagedUserLambda {
  public async handle(request: unknown): Promise<PagedUserItemResponse> {
    validatePagedUserItemRequest(request);

    const lastItem = request.lastItem === null ? null : User.fromDto(request.lastItem);
    const [users, hasMore] = await this.loadPage(request, lastItem);

    return new PagedUserItemResponse(true, null, users.map((user) => user.dto), hasMore);
  }

  protected abstract loadPage(
    request: PagedUserItemRequest,
    lastItem: User | null
  ): Promise<[User[], boolean]>;
}
