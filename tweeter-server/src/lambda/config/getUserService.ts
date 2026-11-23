// AI-assisted: see AI-ATTRIBUTION.md
import { getAWSDependencies } from "./getAWSDependencies";
import { UserService } from "../../model/service/UserService";

let service: UserService | undefined;

/** Lazy composition permits validation before configuration and reuses warm clients. */
export function getUserService(): UserService {
  if (service === undefined) {
    const { factory, authorization } = getAWSDependencies();
    service = new UserService(factory, authorization);
  }
  return service;
}
