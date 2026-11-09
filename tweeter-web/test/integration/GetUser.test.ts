// AI-assisted: see AI-ATTRIBUTION.md
import { AuthToken, User, UserAliasRequest } from "tweeter-shared";
import { UserService } from "../../src/model.service/UserService";
import { ServerFacade } from "../../src/net/ServerFacade";

const baseUrl = process.env.TWEETER_API_BASE_URL ??
  "https://s58iqa332m.execute-api.us-east-1.amazonaws.com/dev";
const facade = new ServerFacade(baseUrl);
const token = "milestone-3-test-token";

function expectAmy(user: User | null): void {
  expect(user).toBeInstanceOf(User);
  expect(user!.dto).toEqual({
    firstName: "Amy", lastName: "Ames", alias: "@amy",
    imageUrl: "https://faculty.cs.byu.edu/~jwilkerson/cs340/tweeter/images/daisy_duck.png",
  });
  expect(user!.name).toBe("Amy Ames");
}

describe("Get User integration", () => {
  it("retrieves the requested profile as a User through ServerFacade", async () => {
    expectAmy(await facade.getUser(new UserAliasRequest(token, "@amy")));
  });

  it("preserves null for an alias with no matching user", async () => {
    await expect(facade.getUser(new UserAliasRequest(token, "@no-such-user"))).resolves.toBeNull();
  });

  it("retrieves the requested profile through the client UserService", async () => {
    const service = new UserService(facade);

    expectAmy(await service.getUser(new AuthToken(token, Date.now()), "@amy"));
  });

  it.each([
    ["alias", new UserAliasRequest(token, ""), "[Bad Request] A user alias is required."],
    ["token", new UserAliasRequest("", "@amy"), "[Bad Request] A token is required."],
  ] as const)("propagates validation errors for an empty %s", async (_description, request, message) => {
    await expect(facade.getUser(request)).rejects.toThrow(message);
  });

  it("allows the browser's POST preflight request", async () => {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/user/get`, {
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
