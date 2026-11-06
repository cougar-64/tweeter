// AI-assisted: see AI-ATTRIBUTION.md
import { AuthToken, FollowingStatusRequest, User } from "tweeter-shared";
import { FollowService } from "../../src/model.service/FollowService";
import { ServerFacade } from "../../src/net/ServerFacade";

const baseUrl = process.env.TWEETER_API_BASE_URL ??
  "https://s58iqa332m.execute-api.us-east-1.amazonaws.com/dev";
const facade = new ServerFacade(baseUrl);
const token = "milestone-3-test-token";

describe("Following status integration", () => {
  it("retrieves a boolean through ServerFacade", async () => {
    const result = await facade.getIsFollowerStatus(new FollowingStatusRequest(token, "@allen", "@amy"));

    expect(typeof result).toBe("boolean");
  });

  it("retrieves a boolean through the client FollowService", async () => {
    const service = new FollowService(facade);
    const currentUser = new User("Allen", "Anderson", "@allen", "https://example.com/allen.png");
    const viewedUser = new User("Amy", "Ames", "@amy", "https://example.com/amy.png");
    const result = await service.getIsFollowerStatus(new AuthToken(token, Date.now()), currentUser, viewedUser);

    expect(typeof result).toBe("boolean");
  });

  it.each([
    ["follower", new FollowingStatusRequest(token, "", "@amy"), "[Bad Request] A follower alias is required."],
    ["followee", new FollowingStatusRequest(token, "@allen", ""), "[Bad Request] A followee alias is required."],
  ] as const)("propagates validation errors for an empty %s alias", async (_description, request, message) => {
    await expect(facade.getIsFollowerStatus(request)).rejects.toThrow(message);
  });

  it("allows the browser's POST preflight request", async () => {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/follow/status`, {
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
