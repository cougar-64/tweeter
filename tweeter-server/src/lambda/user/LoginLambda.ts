// AI-assisted: see AI-ATTRIBUTION.md
import { AuthenticationResponse } from "tweeter-shared";
import { UserService } from "../../model/service/UserService";
import { validateLoginRequest } from "../validation/validateLoginRequest";

export async function handler(request: unknown): Promise<AuthenticationResponse> {
  validateLoginRequest(request);

  const [user, authToken] = await new UserService().login(request.alias, request.password);
  return new AuthenticationResponse(true, null, user.dto, authToken.dto);
}
