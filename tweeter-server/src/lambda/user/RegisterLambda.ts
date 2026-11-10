// AI-assisted: see AI-ATTRIBUTION.md
import type { AuthToken, RegisterRequest, User } from "tweeter-shared";
import { UserService } from "../../model/service/UserService";
import { AuthenticationLambda } from "../AuthenticationLambda";
import { validateRegisterRequest } from "../validation/validateRegisterRequest";

export class RegisterLambda extends AuthenticationLambda<RegisterRequest> {
  protected validateRequest(request: unknown): RegisterRequest {
    validateRegisterRequest(request);
    return request;
  }

  protected authenticate(request: RegisterRequest): Promise<[User, AuthToken]> {
    return new UserService().register(
      request.firstName, request.lastName, request.alias, request.password,
      request.imageStringBase64, request.imageFileExtension
    );
  }
}

export const handler = (request: unknown) => new RegisterLambda().handle(request);
