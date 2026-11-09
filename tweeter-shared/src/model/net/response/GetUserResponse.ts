// AI-assisted: see AI-ATTRIBUTION.md
import type { UserDto } from "../../dto/UserDto";
import { TweeterResponse } from "./TweeterResponse";

export class GetUserResponse extends TweeterResponse {
  public constructor(
    success: boolean,
    message: string | null,
    public readonly user: UserDto | null
  ) {
    super(success, message);
  }
}
