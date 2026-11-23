// AI-assisted: see AI-ATTRIBUTION.md
import { StatusPageLambda } from "./StatusPageLambda";

export class GetFeedLambda extends StatusPageLambda<"loadMoreFeedItems"> {
  protected readonly pageMethod = "loadMoreFeedItems";
}

export const handler = (request: unknown) => new GetFeedLambda().handle(request);
