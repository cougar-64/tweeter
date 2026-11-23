// AI-assisted: see AI-ATTRIBUTION.md
import { loadAWSConfig } from "../../config/AWSConfig";
import { AWSDAOFactory } from "../../model/dao/aws/AWSDAOFactory";
import { AuthorizationService } from "../../model/service/AuthorizationService";

let dependencies: { factory: AWSDAOFactory; authorization: AuthorizationService } | undefined;

/** All service compositions share clients, configuration, and authorization. */
export function getAWSDependencies() {
  if (dependencies === undefined) {
    const config = loadAWSConfig();
    const factory = new AWSDAOFactory(config);
    dependencies = { factory, authorization: new AuthorizationService(factory, config.sessionInactivitySeconds) };
  }
  return dependencies;
}
