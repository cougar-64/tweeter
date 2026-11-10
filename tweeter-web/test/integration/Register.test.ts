// AI-assisted: see AI-ATTRIBUTION.md
import { Buffer } from "buffer";
import { AuthToken, RegisterRequest, User, UserAliasRequest } from "tweeter-shared";
import { UserService } from "../../src/model.service/UserService";
import { ServerFacade } from "../../src/net/ServerFacade";

const baseUrl = process.env.TWEETER_API_BASE_URL ??
  "https://s58iqa332m.execute-api.us-east-1.amazonaws.com/dev";
const facade = new ServerFacade(baseUrl);
const request = new RegisterRequest(
  "Test", "User", "@test-user", "milestone-3-test-password",
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "png"
);

function expectRegistration(result: [User, AuthToken]): void {
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
}

describe("Register integration", () => {
  it("returns the expected dummy user and token through ServerFacade", async () => {
    expectRegistration(await facade.register(request));
  });

  it("sends image bytes through the client UserService and returns domain objects", async () => {
    expectRegistration(await new UserService(facade).register(
      request.firstName, request.lastName, request.alias, request.password,
      new Uint8Array(Buffer.from(request.imageStringBase64, "base64")), request.imageFileExtension
    ));
  });

  it("uses the returned token in a subsequent request", async () => {
    const [, token] = await facade.register(request);
    const user = await facade.getUser(new UserAliasRequest(token.token, "@amy"));

    expect(user).toBeInstanceOf(User);
    expect(user!.name).toBe("Amy Ames");
  });

  it.each([
    ["empty alias", { ...request, alias: "" }, "[Bad Request] An alias is required."],
    ["missing image", { ...request, imageStringBase64: "" }, "[Bad Request] A Base64 image is required."],
    ["malformed image", { ...request, imageStringBase64: "not-base64!" }, "[Bad Request] The image must be valid Base64."],
  ] as const)("propagates validation errors for %s", async (_description, invalidRequest, message) => {
    await expect(facade.register(invalidRequest)).rejects.toThrow(message);
  });

  it("allows the browser's POST preflight request", async () => {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/user/register`, {
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
