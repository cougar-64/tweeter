// AI-assisted: see AI-ATTRIBUTION.md
import { AuthToken, User, UserAliasRequest } from "tweeter-shared";
import { FollowService } from "../../src/model.service/FollowService";
import { ServerFacade } from "../../src/net/ServerFacade";

const baseUrl = process.env.TWEETER_API_BASE_URL ??
  "https://s58iqa332m.execute-api.us-east-1.amazonaws.com/dev";
const facade = new ServerFacade(baseUrl);
const token = "milestone-3-test-token";

describe("Unfollow integration", () => {
  it("completes the simulated operation through ServerFacade", async () => {
    await expect(facade.unfollow(new UserAliasRequest(token, "@amy"))).resolves.toBeUndefined();
  });

  it("completes through the client FollowService", async () => {
    const service = new FollowService(facade);
    const target = new User("Amy", "Ames", "@amy", "https://example.com/amy.png");

    await expect(service.unfollow(new AuthToken(token, Date.now()), target)).resolves.toBeUndefined();
  });

  it.each([
    ["alias", new UserAliasRequest(token, ""), "[Bad Request] A user alias is required."],
    ["token", new UserAliasRequest("", "@amy"), "[Bad Request] A token is required."],
  ] as const)("propagates validation errors for an empty %s", async (_description, request, message) => {
    await expect(facade.unfollow(request)).rejects.toThrow(message);
  });

  it("allows the browser's POST preflight request", async () => {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/unfollow`, {
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
