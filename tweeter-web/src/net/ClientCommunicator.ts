// AI-assisted: see AI-ATTRIBUTION.md
// sends JSON requests and handles HTTP errors
import type { TweeterRequest, TweeterResponse } from "tweeter-shared";

export class ClientCommunicator {
  public constructor(private readonly serverUrl: string) {}

  public async doPost<REQ extends TweeterRequest, RES extends TweeterResponse>(
    request: REQ,
    endpoint: string
  ): Promise<RES> {
    const url = `${this.serverUrl.replace(/\/+$/, "")}/${endpoint.replace(/^\/+/, "")}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(10000),
    });
    const body: unknown = await response.json();

    if (!response.ok) {
      if (typeof body === "object" && body !== null) {
        const error = body as { errorMessage?: unknown; message?: unknown };
        const message = error.errorMessage ?? error.message;
        if (typeof message === "string") {
          throw new Error(message);
        }
      }
      throw new Error(`HTTP request failed with status ${response.status}.`);
    }

    if (!this.isTweeterResponse(body)) {
      throw new Error("Invalid server response.");
    }

    // The facade validates feature-specific fields after these common fields.
    return body as RES;
  }

  private isTweeterResponse(value: unknown): value is TweeterResponse {
    if (typeof value !== "object" || value === null) {
      return false;
    }
    const response = value as Partial<TweeterResponse>;
    return (
      typeof response.success === "boolean" &&
      (response.message == null || typeof response.message === "string")
    );
  }
}
