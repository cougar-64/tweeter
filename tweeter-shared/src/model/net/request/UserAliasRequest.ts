// AI-assisted: see AI-ATTRIBUTION.md
import { AuthenticatedRequest } from "./AuthenticatedRequest";

export class UserAliasRequest extends AuthenticatedRequest {
  public constructor(token: string, public readonly userAlias: string) {
    super(token);
  }
}
