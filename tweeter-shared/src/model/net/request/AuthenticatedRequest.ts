// AI-assisted: see AI-ATTRIBUTION.md
import { TweeterRequest } from "./TweeterRequest";

export class AuthenticatedRequest extends TweeterRequest {
  public constructor(public readonly token: string) {
    super();
  }
}
