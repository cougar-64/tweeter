// AI-assisted: see AI-ATTRIBUTION.md
import { Status, Type, User } from "tweeter-shared";
import { handler } from "../../../tweeter-server/src/lambda/status/PostStatusLambda";
import { StatusService } from "../../../tweeter-server/src/model/service/StatusService";

const status = new Status("Hello @amy! https://byu.edu", new User("Allen", "Anderson", "@allen", "image.png"), 0);
const request = { token: "dummy-token", status: status.dto };

describe("Post Status Lambda", () => {
  afterEach(() => jest.restoreAllMocks());

  it("reconstructs the status and author and waits for server completion", async () => {
    let complete!: () => void;
    const pending = new Promise<void>((resolve) => { complete = resolve; });
    const operation = jest.spyOn(StatusService.prototype, "postStatus").mockReturnValue(pending);
    let settled = false;
    const response = handler(JSON.parse(JSON.stringify(request))).then((result) => { settled = true; return result; });

    await Promise.resolve();
    expect(settled).toBe(false);
    expect(operation).toHaveBeenCalledWith(request.token, expect.any(Status));
    const received = operation.mock.calls[0][1];
    expect(received.user).toBeInstanceOf(User);
    expect(received.equals(status)).toBe(true);
    expect(received.segments.some((segment) => segment.type === Type.alias && segment.text === "@amy")).toBe(true);
    complete();
    await expect(response).resolves.toEqual({ success: true, message: null });
  });

  it("propagates service failures instead of reporting successful posting", async () => {
    jest.spyOn(StatusService.prototype, "postStatus").mockRejectedValue(new Error("Posting failed"));

    await expect(handler(request)).rejects.toThrow("Posting failed");
  });

  it.each<[string, unknown]>([
    ["missing request", undefined], ["null request", null], ["array request", []],
    ["missing token", { status: status.dto }], ["blank token", { ...request, token: " " }],
    ["missing status", { token: request.token }], ["null status", { ...request, status: null }],
    ["missing author", { ...request, status: { ...status.dto, user: null } }],
    ["non-string post", { ...request, status: { ...status.dto, post: 123 } }],
    ["blank post", { ...request, status: { ...status.dto, post: " \n " } }],
    ["negative timestamp", { ...request, status: { ...status.dto, timestamp: -1 } }],
    ["non-string timestamp", { ...request, status: { ...status.dto, timestamp: "0" } }],
    ["nonfinite timestamp", { ...request, status: { ...status.dto, timestamp: Infinity } }],
    ["blank author alias", { ...request, status: { ...status.dto, user: { ...status.user.dto, alias: " " } } }],
  ])("rejects %s before calling the service", async (_description, invalidRequest) => {
    const operation = jest.spyOn(StatusService.prototype, "postStatus");

    await expect(handler(invalidRequest)).rejects.toThrow("[Bad Request]");
    expect(operation).not.toHaveBeenCalled();
  });
});
