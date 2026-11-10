// AI-assisted: see AI-ATTRIBUTION.md
import { AuthenticationResponse } from "tweeter-shared";
import type { AuthToken, TweeterRequest, User } from "tweeter-shared";

export abstract class AuthenticationLambda<REQ extends TweeterRequest> {
  public async handle(request: unknown): Promise<AuthenticationResponse> {
    const validatedRequest = this.validateRequest(request);
    const [user, authToken] = await this.authenticate(validatedRequest);
    return new AuthenticationResponse(true, null, user.dto, authToken.dto);
  }

  protected abstract validateRequest(request: unknown): REQ;
  protected abstract authenticate(request: REQ): Promise<[User, AuthToken]>;
}
