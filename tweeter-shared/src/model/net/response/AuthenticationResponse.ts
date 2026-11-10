// AI-assisted: see AI-ATTRIBUTION.md
import type { AuthTokenDto } from "../../dto/AuthTokenDto";
import type { UserDto } from "../../dto/UserDto";
import { TweeterResponse } from "./TweeterResponse";

export class AuthenticationResponse extends TweeterResponse {
  public constructor(
    success: boolean,
    message: string | null,
    public readonly user: UserDto,
    public readonly authToken: AuthTokenDto
  ) {
    super(success, message);
  }
}
