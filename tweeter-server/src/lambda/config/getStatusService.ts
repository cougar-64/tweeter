// AI-assisted: see AI-ATTRIBUTION.md
import { StatusService } from "../../model/service/StatusService";
import { createServiceProvider } from "./createServiceProvider";

export const getStatusService = createServiceProvider(
  ({ factory, authorization }) => new StatusService(factory, authorization)
);
