// AI-assisted: see AI-ATTRIBUTION.md
import type { AuthToken, RegisterRequest, User } from "tweeter-shared";
import type { UserService } from "../../model/service/UserService";
import { getUserService } from "../config/getUserService";
import { AuthenticationLambda } from "../AuthenticationLambda";
import { validateRegisterRequest } from "../validation/validateRegisterRequest";

export class RegisterLambda extends AuthenticationLambda<RegisterRequest> {
  public constructor(private readonly service?: Pick<UserService, "register">) {
    super();
  }

  protected validateRequest(request: unknown): RegisterRequest {
    validateRegisterRequest(request);
    return request;
  }

  protected authenticate(request: RegisterRequest): Promise<[User, AuthToken]> {
    return (this.service ?? getUserService()).register(
      request.firstName, request.lastName, request.alias, request.password,
      request.imageStringBase64, request.imageFileExtension
    );
  }
}

export const handler = (request: unknown) => new RegisterLambda().handle(request);
