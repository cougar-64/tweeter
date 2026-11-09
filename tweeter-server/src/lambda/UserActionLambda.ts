// AI-assisted: see AI-ATTRIBUTION.md
import { TweeterResponse } from "tweeter-shared";
import type { UserAliasRequest } from "tweeter-shared";
import { validateUserAliasRequest } from "./validation/validateUserAliasRequest";

export abstract class UserActionLambda {
  public async handle(request: unknown): Promise<TweeterResponse> {
    validateUserAliasRequest(request);

    await this.performAction(request);
    return new TweeterResponse(true);
  }

  protected abstract performAction(request: UserAliasRequest): Promise<void>;
}
