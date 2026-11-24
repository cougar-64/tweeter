// AI-assisted: see AI-ATTRIBUTION.md
import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { AuthToken, LoginRequest, PagedStatusItemRequest, RegisterRequest, User, UserAliasRequest } from "tweeter-shared";
import { fixtureImageBase64 } from "../../../tweeter-server/src/tools/milestone4Fixtures";
import { UserService } from "../../src/model.service/UserService";
import { expectLiveError, expectLivePreflight, loadLiveTestContext, type LiveTestContext } from "./support/liveTestContext";

describe("Persisted registration integration", () => {
  let context: LiveTestContext;
  const newRequest = () => new RegisterRequest("Registered", "Tester", `@registration-${randomUUID()}`,
    context.password, fixtureImageBase64, "png");
  beforeAll(async () => { context = await loadLiveTestContext(); });
  afterAll(async () => { await context?.cleanup(); });

  it.each(["facade", "service"] as const)("registers through the %s, signs in automatically, and starts with empty lists", async (client) => {
    const request = newRequest();
    const [user, token] = context.track(client === "facade" ? await context.facade.register(request)
      : await new UserService(context.facade).register(request.firstName, request.lastName, request.alias,
        request.password, new Uint8Array(Buffer.from(request.imageStringBase64, "base64")), "png"));
    expect(user).toBeInstanceOf(User);
    expect(user.dto).toEqual({ firstName: request.firstName, lastName: request.lastName, alias: request.alias, imageUrl: user.imageUrl });
    expect(token).toBeInstanceOf(AuthToken);
    expect(token.token).toMatch(/^[a-f0-9]{64}$/);
    expect(token.timestamp).toBeGreaterThan(0);
    expect(new URL(user.imageUrl).protocol).toBe("https:");
    expect(new URL(user.imageUrl).pathname).toMatch(/^\/image\//);
    const authRequest = new UserAliasRequest(token.token, user.alias);
    await expect(context.facade.getUser(authRequest)).resolves.toEqual(user);
    await expect(context.facade.getMoreFeed(new PagedStatusItemRequest(token.token, user.alias, 10, null))).resolves.toEqual([[], false]);
    await expect(context.facade.getMoreStory(new PagedStatusItemRequest(token.token, user.alias, 10, null))).resolves.toEqual([[], false]);
    await expect(context.facade.getFollowerCount(authRequest)).resolves.toBe(0);
    await expect(context.facade.getFolloweeCount(authRequest)).resolves.toBe(0);

    const image = await fetch(user.imageUrl, { signal: AbortSignal.timeout(10000) });
    expect(image.status).toBe(200);
    expect(image.headers.get("content-type")).toBe("image/png");
    expect(Buffer.from(await image.arrayBuffer())).toEqual(Buffer.from(fixtureImageBase64, "base64"));

    const [returningUser] = context.track(await context.facade.login(new LoginRequest(user.alias, request.password)));
    expect(returningUser.dto).toEqual(user.dto);
    // A duplicate must preserve the original account and public image reference.
    await expectLiveError(context, "/user/register", { ...request, firstName: "Replacement" }, 400, "[Bad Request] That alias is already registered.");
    await expect(context.facade.getUser(authRequest)).resolves.toEqual(user);
  });

  it.each(["alias", "image", "malformedImage"] as const)("returns 400 with CORS for invalid %s", async (field) => {
    const request = newRequest();
    const body = { ...request, ...(field === "alias" ? { alias: "" } : { imageStringBase64: field === "image" ? "" : "not-base64!" }) };
    const message = field === "alias" ? "[Bad Request] An alias is required." : field === "image"
      ? "[Bad Request] A Base64 image is required." : "[Bad Request] The image must be valid Base64.";
    await expectLiveError(context, "/user/register", body, 400, message);
  });

  it("allows browser preflight", async () => { await expectLivePreflight(context, "/user/register"); });
});
