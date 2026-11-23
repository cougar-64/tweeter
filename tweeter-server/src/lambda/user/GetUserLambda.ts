// AI-assisted: see AI-ATTRIBUTION.md
import { GetUserResponse } from "tweeter-shared";
import type { UserService } from "../../model/service/UserService";
import { getUserService } from "../config/getUserService";
import { validateUserAliasRequest } from "../validation/validateUserAliasRequest";

export class GetUserLambda {
  public constructor(private readonly service?: Pick<UserService, "getUser">) {}

  public async handle(request: unknown): Promise<GetUserResponse> {
    validateUserAliasRequest(request);
    const user = await (this.service ?? getUserService()).getUser(request.token, request.userAlias);
    return new GetUserResponse(true, null, user === null ? null : user.dto);
  }
}

export const handler = (request: unknown) => new GetUserLambda().handle(request);
