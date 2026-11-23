// AI-assisted: see AI-ATTRIBUTION.md
import { FollowActionLambda } from "./FollowActionLambda";

export class UnfollowLambda extends FollowActionLambda {
  protected readonly action = "unfollow" as const;
}

export const handler = (request: unknown) => new UnfollowLambda().handle(request);
