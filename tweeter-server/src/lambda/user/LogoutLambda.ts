// AI-assisted: see AI-ATTRIBUTION.md
import { TweeterResponse } from "tweeter-shared";
import type { UserService } from "../../model/service/UserService";
import { getUserService } from "../config/getUserService";
import { validateAuthenticatedRequest } from "../validation/validateTweeterRequest";

export class LogoutLambda {
  public constructor(private readonly service?: Pick<UserService, "logout">) {}

  public async handle(request: unknown): Promise<TweeterResponse> {
    validateAuthenticatedRequest(request);
    await (this.service ?? getUserService()).logout(request.token);
    return new TweeterResponse(true);
  }
}

export const handler = (request: unknown) => new LogoutLambda().handle(request);
