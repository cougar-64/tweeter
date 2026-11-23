// AI-assisted: see AI-ATTRIBUTION.md
import { FollowService } from "../../model/service/FollowService";
import { getAWSDependencies } from "./getAWSDependencies";

let service: FollowService | undefined;

export function getFollowService(): FollowService {
  if (service === undefined) {
    const { factory, authorization } = getAWSDependencies();
    service = new FollowService(factory, authorization);
  }
  return service;
}
