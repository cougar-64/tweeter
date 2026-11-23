/** @jest-environment node */
/// <reference types="node" />
// AI-assisted: see AI-ATTRIBUTION.md
import { handler as followHandler } from "../../../tweeter-server/src/lambda/follow/FollowLambda";
import { handler as unfollowHandler } from "../../../tweeter-server/src/lambda/follow/UnfollowLambda";
import { FollowService } from "../../../tweeter-server/src/model/service/FollowService";
import * as composition from "../../../tweeter-server/src/lambda/config/getFollowService";
import { FollowLambda } from "../../../tweeter-server/src/lambda/follow/FollowLambda";
import { UnfollowLambda } from "../../../tweeter-server/src/lambda/follow/UnfollowLambda";

const request = { token: "test-token", userAlias: "@amy" };

describe.each([
  { action: "follow" as const, otherAction: "unfollow" as const, handler: followHandler },
  { action: "unfollow" as const, otherAction: "follow" as const, handler: unfollowHandler },
])("$action Lambda", ({ action, otherAction, handler }) => {
  beforeEach(() => jest.spyOn(composition, "getFollowService").mockReturnValue(new FollowService()));
  afterEach(() => jest.restoreAllMocks());

  it("waits for the service before reporting success and passes the token and target alias", async () => {
    let complete!: () => void;
    const pendingOperation = new Promise<void>((resolve) => { complete = resolve; });
    const operation = jest.spyOn(FollowService.prototype, action).mockReturnValue(pendingOperation);
    const otherOperation = jest.spyOn(FollowService.prototype, otherAction);
    let settled = false;
    const response = handler(request).then((result) => { settled = true; return result; });

    await Promise.resolve();
    expect(settled).toBe(false);
    expect(operation).toHaveBeenCalledTimes(1);
    expect(operation).toHaveBeenCalledWith(request.token, request.userAlias);
    expect(otherOperation).not.toHaveBeenCalled();
    complete();
    await expect(response).resolves.toEqual({ success: true, message: null });
  });

  it("propagates a service failure instead of reporting success", async () => {
    jest.spyOn(FollowService.prototype, action).mockRejectedValue(new Error("Service failure"));

    await expect(handler(request)).rejects.toThrow("Service failure");
  });

  it("supports service injection through the shared action base", async () => {
    const service = { follow: jest.fn().mockResolvedValue(undefined), unfollow: jest.fn().mockResolvedValue(undefined) };
    const lambda = action === "follow" ? new FollowLambda(service) : new UnfollowLambda(service);
    await expect(lambda.handle(request)).resolves.toEqual({ success: true, message: null });
    expect(service[action]).toHaveBeenCalledWith(request.token, request.userAlias);
    expect(service[otherAction]).not.toHaveBeenCalled();
    expect(composition.getFollowService).not.toHaveBeenCalled();
  });

  it("propagates authorization failures for the API 401 mapping", async () => {
    jest.spyOn(FollowService.prototype, action).mockRejectedValue(new Error("[Unauthorized] Invalid or expired authentication token."));
    await expect(handler(request)).rejects.toThrow("[Unauthorized]");
  });

  it.each([
    ["missing request", undefined],
    ["null request", null],
    ["array request", []],
    ["missing token", { userAlias: "@amy" }],
    ["blank token", { ...request, token: " " }],
    ["non-string token", { ...request, token: 123 }],
    ["missing alias", { token: request.token }],
    ["blank alias", { ...request, userAlias: " " }],
    ["non-string alias", { ...request, userAlias: null }],
  ])("rejects %s before calling the service", async (_description, invalidRequest) => {
    const operation = jest.spyOn(FollowService.prototype, action);

    await expect(handler(invalidRequest)).rejects.toThrow("[Bad Request]");
    expect(operation).not.toHaveBeenCalled();
    expect(composition.getFollowService).not.toHaveBeenCalled();
  });
});
