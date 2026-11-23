// AI-assisted: see AI-ATTRIBUTION.md
import { FollowCountLambda } from "./FollowCountLambda";

export class GetFollowerCountLambda extends FollowCountLambda {
  protected readonly countMethod = "getFollowerCount" as const;
}

export const handler = (request: unknown) => new GetFollowerCountLambda().handle(request);
