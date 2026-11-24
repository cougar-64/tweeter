// AI-assisted: see AI-ATTRIBUTION.md
import { UserService } from "../../model/service/UserService";
import { createServiceProvider } from "./createServiceProvider";

export const getUserService = createServiceProvider(
  ({ factory, authorization }) => new UserService(factory, authorization)
);
