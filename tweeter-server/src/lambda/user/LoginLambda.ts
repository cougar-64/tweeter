// AI-assisted: see AI-ATTRIBUTION.md
import type { AuthToken, LoginRequest, User } from "tweeter-shared";
import type { UserService } from "../../model/service/UserService";
import { getUserService } from "../config/getUserService";
import { AuthenticationLambda } from "../AuthenticationLambda";
import { validateLoginRequest } from "../validation/validateLoginRequest";

export class LoginLambda extends AuthenticationLambda<LoginRequest> {
  public constructor(private readonly service?: Pick<UserService, "login">) {
    super();
  }

  protected validateRequest(request: unknown): LoginRequest {
    validateLoginRequest(request);
    return request;
  }

  protected authenticate(request: LoginRequest): Promise<[User, AuthToken]> {
    return (this.service ?? getUserService()).login(request.alias, request.password);
  }
}

export const handler = (request: unknown) => new LoginLambda().handle(request);
