// AI-assisted: see AI-ATTRIBUTION.md
import { TweeterRequest } from "./TweeterRequest";

export class LoginRequest extends TweeterRequest {
  public constructor(public readonly alias: string, public readonly password: string) {
    super();
  }
}
