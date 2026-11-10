// AI-assisted: see AI-ATTRIBUTION.md
import { AuthenticatedRequest } from "./AuthenticatedRequest";

export class FollowingStatusRequest extends AuthenticatedRequest {
  public constructor(
    token: string,
    public readonly followerAlias: string,
    public readonly followeeAlias: string
  ) {
    super(token);
  }
}
