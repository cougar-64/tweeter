// AI-assisted: see AI-ATTRIBUTION.md
import { GetUserResponse } from "tweeter-shared";
import { UserService } from "../../model/service/UserService";
import { validateUserAliasRequest } from "../validation/validateUserAliasRequest";

export async function handler(request: unknown): Promise<GetUserResponse> {
  validateUserAliasRequest(request);

  const user = await new UserService().getUser(request.token, request.userAlias);
  return new GetUserResponse(true, null, user === null ? null : user.dto);
}
