// AI-assisted: see AI-ATTRIBUTION.md
import { AuthToken, User, UserAliasRequest } from "tweeter-shared";
import { ServerFacade } from "../../src/net/ServerFacade";
import { FollowService } from "../../src/model.service/FollowService";

const baseUrl = process.env.TWEETER_API_BASE_URL ??
  "https://s58iqa332m.execute-api.us-east-1.amazonaws.com/dev";
const serverFacade = new ServerFacade(baseUrl);
const token = "milestone-3-test-token";

function expectFakeDataCount(count: number): void {
  expect(Number.isInteger(count)).toBe(true);
  expect(count).toBeGreaterThanOrEqual(1);
  expect(count).toBeLessThanOrEqual(10);
}

describe("Followee count integration", () => {
  it("retrieves a valid FakeData followee count through ServerFacade", async () => {
    const count = await serverFacade.getFolloweeCount(new UserAliasRequest(token, "@allen"));

    expectFakeDataCount(count);
  });

  it("retrieves the count through the client FollowService", async () => {
    const user = new User("Allen", "Anderson", "@allen", "https://example.com/allen.png");
    const service = new FollowService(serverFacade);
    const count = await service.getFolloweeCount(new AuthToken(token, Date.now()), user);

    expectFakeDataCount(count);
  });

  it("propagates validation errors for an empty alias", async () => {
    await expect(
      serverFacade.getFolloweeCount(new UserAliasRequest(token, ""))
    ).rejects.toThrow("[Bad Request] A user alias is required.");
  });

  it("allows the browser's POST preflight request", async () => {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/followees/count`, {
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
