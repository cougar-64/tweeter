// AI-assisted: see AI-ATTRIBUTION.md
import { TweeterResponse } from "./TweeterResponse";

export class CountResponse extends TweeterResponse {
  public constructor(
    success: boolean,
    message: string | null,
    public readonly count: number
  ) {
    super(success, message);
  }
}
