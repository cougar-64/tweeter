// AI-assisted: see AI-ATTRIBUTION.md
import { FollowPageLambda } from "./FollowPageLambda";

export class GetFollowersLambda extends FollowPageLambda {
  protected readonly pageMethod = "loadMoreFollowers" as const;
}

// AWS invokes this exported function, which starts the shared template method.
export const handler = (request: unknown) => new GetFollowersLambda().handle(request);
