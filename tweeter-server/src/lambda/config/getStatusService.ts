// AI-assisted: see AI-ATTRIBUTION.md
import { StatusService } from "../../model/service/StatusService";
import { getAWSDependencies } from "./getAWSDependencies";

let service: StatusService | undefined;

export function getStatusService(): StatusService {
  if (service === undefined) {
    const { factory, authorization } = getAWSDependencies();
    service = new StatusService(factory, authorization);
  }
  return service;
}
