// AI-assisted: see AI-ATTRIBUTION.md
import { FollowCountLambda } from "./FollowCountLambda";

export class GetFolloweeCountLambda extends FollowCountLambda {
  protected readonly countMethod = "getFolloweeCount" as const;
}

export const handler = (request: unknown) => new GetFolloweeCountLambda().handle(request);
