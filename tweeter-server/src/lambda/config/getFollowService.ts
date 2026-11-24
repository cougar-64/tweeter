// AI-assisted: see AI-ATTRIBUTION.md
import { FollowService } from "../../model/service/FollowService";
import { createServiceProvider } from "./createServiceProvider";

export const getFollowService = createServiceProvider(
  ({ factory, authorization }) => new FollowService(factory, authorization)
);
