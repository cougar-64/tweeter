/** @jest-environment node */
/// <reference types="node" />
// AI-assisted: see AI-ATTRIBUTION.md
import { handler as getFollowerCount } from "../../../tweeter-server/src/lambda/follow/GetFollowerCountLambda";
import { handler as getFolloweeCount } from "../../../tweeter-server/src/lambda/follow/GetFolloweeCountLambda";
import { FollowService } from "../../../tweeter-server/src/model/service/FollowService";
import { GetFollowerCountLambda } from "../../../tweeter-server/src/lambda/follow/GetFollowerCountLambda";
import { GetFolloweeCountLambda } from "../../../tweeter-server/src/lambda/follow/GetFolloweeCountLambda";
import * as composition from "../../../tweeter-server/src/lambda/config/getFollowService";

const request = { token: "milestone-3-test-token", userAlias: "@allen" };

describe.each([
  ["Follower", getFollowerCount, "getFollowerCount", GetFollowerCountLambda],
  ["Followee", getFolloweeCount, "getFolloweeCount", GetFolloweeCountLambda],
] as const)("%s count Lambda", (_feature, handler, serviceMethod, Lambda) => {
  beforeEach(() => jest.spyOn(composition, "getFollowService").mockReturnValue(new FollowService()));
  afterEach(() => jest.restoreAllMocks());

  it("supports injected services through the shared count base", async () => {
    const service = { getFollowerCount: jest.fn().mockResolvedValue(17), getFolloweeCount: jest.fn().mockResolvedValue(23) };
    await expect(new Lambda(service).handle(request)).resolves.toEqual({
      success: true, message: null, count: serviceMethod === "getFollowerCount" ? 17 : 23,
    });
    expect(service[serviceMethod]).toHaveBeenCalledWith(request.token, request.userAlias);
    expect(composition.getFollowService).not.toHaveBeenCalled();
  });

  it("delegates the token and alias and preserves a zero count", async () => {
    const operation = jest.spyOn(FollowService.prototype, serviceMethod).mockResolvedValue(0);

    const response = await handler(request);

    expect(operation).toHaveBeenCalledTimes(1);
    expect(operation).toHaveBeenCalledWith(request.token, request.userAlias);
    expect(response).toEqual({ success: true, message: null, count: 0 });
  });

  it("propagates service failures", async () => {
    jest.spyOn(FollowService.prototype, serviceMethod).mockRejectedValue(new Error("Service failure"));

    await expect(handler(request)).rejects.toThrow("Service failure");
  });

  it("propagates authorization errors for the API's 401 mapping", async () => {
    jest.spyOn(FollowService.prototype, serviceMethod).mockRejectedValue(new Error("[Unauthorized] Invalid or expired authentication token."));
    await expect(handler(request)).rejects.toThrow("[Unauthorized]");
  });

  it.each([
    ["missing request", undefined],
    ["null request", null],
    ["array request", []],
    ["missing token", { userAlias: "@allen" }],
    ["blank token", { ...request, token: " " }],
    ["missing alias", { token: request.token }],
    ["blank alias", { ...request, userAlias: " " }],
  ])("rejects %s before calling the service", async (_description, invalidRequest) => {
    const operation = jest.spyOn(FollowService.prototype, serviceMethod);

    await expect(handler(invalidRequest)).rejects.toThrow("[Bad Request]");
    expect(operation).not.toHaveBeenCalled();
    expect(composition.getFollowService).not.toHaveBeenCalled();
  });
});
