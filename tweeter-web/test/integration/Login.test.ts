// AI-assisted: see AI-ATTRIBUTION.md
import { AuthToken, LoginRequest, User, UserAliasRequest } from "tweeter-shared";
import { UserService } from "../../src/model.service/UserService";
import { ServerFacade } from "../../src/net/ServerFacade";

const baseUrl = process.env.TWEETER_API_BASE_URL ??
  "https://s58iqa332m.execute-api.us-east-1.amazonaws.com/dev";
const facade = new ServerFacade(baseUrl);
const request = new LoginRequest("@allen", "milestone-3-test-password");

function expectLoginResult(result: [User, AuthToken]): void {
  const [user, token] = result;
  expect(user).toBeInstanceOf(User);
  expect(user.dto).toEqual({
    firstName: "Allen", lastName: "Anderson", alias: "@allen",
    imageUrl: "https://faculty.cs.byu.edu/~jwilkerson/cs340/tweeter/images/donald_duck.png",
  });
  expect(token).toBeInstanceOf(AuthToken);
  expect(typeof token.token).toBe("string");
  expect(token.token.trim().length).toBeGreaterThan(0);
  expect(Number.isFinite(token.timestamp)).toBe(true);
  expect(token.timestamp).toBeGreaterThan(0);
  expect(AuthToken.fromJson(token.toJson())!.dto).toEqual(token.dto);
}

describe("Login integration", () => {
  it("retrieves the dummy user and token through ServerFacade", async () => {
    expectLoginResult(await facade.login(request));
  });

  it("retrieves the dummy user and token through the client UserService", async () => {
    expectLoginResult(await new UserService(facade).login(request.alias, request.password));
  });

  it("uses the returned token in an authenticated request", async () => {
    const [, token] = await facade.login(request);
    const user = await facade.getUser(new UserAliasRequest(token.token, "@amy"));

    expect(user).toBeInstanceOf(User);
    expect(user!.alias).toBe("@amy");
    expect(user!.name).toBe("Amy Ames");
  });

  it.each([
    ["alias", new LoginRequest("", request.password), "[Bad Request] An alias is required."],
    ["password", new LoginRequest(request.alias, ""), "[Bad Request] A password is required."],
  ] as const)("propagates validation errors for an empty %s", async (_description, invalidRequest, message) => {
    await expect(facade.login(invalidRequest)).rejects.toThrow(message);
  });

  it("allows the browser's POST preflight request", async () => {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/user/login`, {
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
