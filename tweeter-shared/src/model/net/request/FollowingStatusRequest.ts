// AI-assisted: see AI-ATTRIBUTION.md
import { TweeterRequest } from "./TweeterRequest";

export class FollowingStatusRequest extends TweeterRequest {
  public constructor(
    token: string,
    public readonly followerAlias: string,
    public readonly followeeAlias: string
  ) {
    super(token);
  }
}
