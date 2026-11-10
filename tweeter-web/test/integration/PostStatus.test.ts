// AI-assisted: see AI-ATTRIBUTION.md
import { AuthToken, PostStatusRequest, Status, User } from "tweeter-shared";
import { StatusService } from "../../src/model.service/StatusService";
import { ServerFacade } from "../../src/net/ServerFacade";

const baseUrl = process.env.TWEETER_API_BASE_URL ??
  "https://s58iqa332m.execute-api.us-east-1.amazonaws.com/dev";
const facade = new ServerFacade(baseUrl);
const token = "milestone-3-test-token";
const status = new Status("Milestone 3 test post @amy https://byu.edu", new User(
  "Allen", "Anderson", "@allen", "https://faculty.cs.byu.edu/~jwilkerson/cs340/tweeter/images/donald_duck.png"
), Date.now());

describe("Post Status integration", () => {
  it("completes simulated posting through ServerFacade", async () => {
    await expect(facade.postStatus(new PostStatusRequest(token, status.dto))).resolves.toBeUndefined();
  });

  it("posts a domain status through the client StatusService", async () => {
    await expect(new StatusService(facade).postStatus(new AuthToken(token, Date.now()), status)).resolves.toBeUndefined();
  });

  it.each([
    ["empty token", new PostStatusRequest("", status.dto), "[Bad Request] A token is required."],
    ["blank post", new PostStatusRequest(token, { ...status.dto, post: " \n " }), "[Bad Request] A nonempty post is required."],
    ["malformed status", { token, status: { ...status.dto, user: {} } }, "[Bad Request] A valid status DTO is required."],
  ] as const)("returns HTTP 400 and CORS for %s", async (_description, request, message) => {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/status/post`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request),
      signal: AbortSignal.timeout(10000),
    });
    expect(response.status).toBe(400);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    await expect(response.json()).resolves.toEqual({ errorMessage: message });
  });

  it("allows the browser's POST preflight request", async () => {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/status/post`, {
      method: "OPTIONS",
      headers: { Origin: "http://localhost:5173", "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type" },
      signal: AbortSignal.timeout(10000),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("access-control-allow-methods")).toContain("POST");
    expect(response.headers.get("access-control-allow-headers")?.toLowerCase()).toContain("content-type");
    await response.text();
  });
});
