// AI-assisted: see AI-ATTRIBUTION.md
import { getAWSDependencies } from "./getAWSDependencies";

/** Defer configuration until first use and reuse a successfully created service. */
export function createServiceProvider<T extends object>(
  create: (dependencies: ReturnType<typeof getAWSDependencies>) => T
): () => T {
  let service: T | undefined;
  return () => {
    if (service === undefined) service = create(getAWSDependencies());
    return service;
  };
}
