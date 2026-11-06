// AI-assisted: see AI-ATTRIBUTION.md
import { TweeterResponse } from "./TweeterResponse";

export class FollowingStatusResponse extends TweeterResponse {
  public constructor(
    success: boolean,
    message: string | null,
    public readonly isFollower: boolean
  ) {
    super(success, message);
  }
}
