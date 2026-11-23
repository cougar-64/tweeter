// AI-assisted: see AI-ATTRIBUTION.md
import { loadAWSConfig } from "../../config/AWSConfig";
import { AWSDAOFactory } from "../../model/dao/aws/AWSDAOFactory";
import { AuthorizationService } from "../../model/service/AuthorizationService";
import { UserService } from "../../model/service/UserService";

let service: UserService | undefined;

/** Lazy composition permits validation before configuration and reuses warm clients. */
export function getUserService(): UserService {
  if (service === undefined) {
    const config = loadAWSConfig();
    const factory = new AWSDAOFactory(config);
    service = new UserService(factory, new AuthorizationService(factory, config.sessionInactivitySeconds));
  }
  return service;
}
