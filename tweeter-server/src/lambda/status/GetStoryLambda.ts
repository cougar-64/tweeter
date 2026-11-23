// AI-assisted: see AI-ATTRIBUTION.md
import { StatusPageLambda } from "./StatusPageLambda";

export class GetStoryLambda extends StatusPageLambda<"loadMoreStoryItems"> {
  protected readonly pageMethod = "loadMoreStoryItems";
}

export const handler = (request: unknown) => new GetStoryLambda().handle(request);
