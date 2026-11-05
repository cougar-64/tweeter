// AI-assisted: see AI-ATTRIBUTION.md
import { TweeterRequest } from "./TweeterRequest";

export class UserAliasRequest extends TweeterRequest {
  public constructor(token: string, public readonly userAlias: string) {
    super(token);
  }
}
