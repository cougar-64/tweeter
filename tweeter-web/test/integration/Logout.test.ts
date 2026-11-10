// AI-assisted: see AI-ATTRIBUTION.md
import { AuthenticatedRequest, AuthToken, LoginRequest } from "tweeter-shared";
import { UserService } from "../../src/model.service/UserService";
import { ServerFacade } from "../../src/net/ServerFacade";

const baseUrl = process.env.TWEETER_API_BASE_URL ??
  "https://s58iqa332m.execute-api.us-east-1.amazonaws.com/dev";
const facade = new ServerFacade(baseUrl);

describe("Logout integration", () => {
  it("logs out through ServerFacade using a token returned by Login", async () => {
    const [, token] = await facade.login(new LoginRequest("@allen", "milestone-3-test-password"));

    await expect(facade.logout(new AuthenticatedRequest(token.token))).resolves.toBeUndefined();
  });

  it("completes the simulated logout through the client UserService", async () => {
    await expect(new UserService(facade).logout(new AuthToken("milestone-3-test-token", Date.now())))
      .resolves.toBeUndefined();
  });

  it("propagates an empty-token validation error", async () => {
    await expect(facade.logout(new AuthenticatedRequest(""))).rejects.toThrow("[Bad Request] A token is required.");
  });

  it("allows the browser's POST preflight request", async () => {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/user/logout`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
      },
      signal: AbortSignal.timeout(10000),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("access-control-allow-methods")).toContain("POST");
    expect(response.headers.get("access-control-allow-headers")?.toLowerCase()).toContain("content-type");
    await response.text();
  });
});
