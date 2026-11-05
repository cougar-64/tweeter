// AI-assisted: see AI-ATTRIBUTION.md
import { CountResponse } from "tweeter-shared";
import type { UserAliasRequest } from "tweeter-shared";
import { validateUserAliasRequest } from "./validation/validateUserAliasRequest";

export abstract class CountLambda {
  public async handle(request: unknown): Promise<CountResponse> {
    validateUserAliasRequest(request);

    const count = await this.loadCount(request);
    return new CountResponse(true, null, count);
  }

  protected abstract loadCount(request: UserAliasRequest): Promise<number>;
}
