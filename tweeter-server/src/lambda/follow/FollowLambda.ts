// AI-assisted: see AI-ATTRIBUTION.md
import { FollowActionLambda } from "./FollowActionLambda";

export class FollowLambda extends FollowActionLambda {
  protected readonly action = "follow" as const;
}

export const handler = (request: unknown) => new FollowLambda().handle(request);
