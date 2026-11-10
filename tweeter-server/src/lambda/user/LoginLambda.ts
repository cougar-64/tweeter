// AI-assisted: see AI-ATTRIBUTION.md
import type { AuthToken, LoginRequest, User } from "tweeter-shared";
import { UserService } from "../../model/service/UserService";
import { AuthenticationLambda } from "../AuthenticationLambda";
import { validateLoginRequest } from "../validation/validateLoginRequest";

export class LoginLambda extends AuthenticationLambda<LoginRequest> {
  protected validateRequest(request: unknown): LoginRequest {
    validateLoginRequest(request);
    return request;
  }

  protected authenticate(request: LoginRequest): Promise<[User, AuthToken]> {
    return new UserService().login(request.alias, request.password);
  }
}

export const handler = (request: unknown) => new LoginLambda().handle(request);
