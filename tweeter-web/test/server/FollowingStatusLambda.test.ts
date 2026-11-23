/** @jest-environment node */
/// <reference types="node" />
// AI-assisted: see AI-ATTRIBUTION.md
import { handler, GetFollowingStatusLambda } from "../../../tweeter-server/src/lambda/follow/GetFollowingStatusLambda";
import { FollowService } from "../../../tweeter-server/src/model/service/FollowService";
import * as composition from "../../../tweeter-server/src/lambda/config/getFollowService";

const request = { token: "test-token", followerAlias: "@allen", followeeAlias: "@amy" };

describe("Following status Lambda", () => {
  beforeEach(() => jest.spyOn(composition, "getFollowService").mockReturnValue(new FollowService()));
  afterEach(() => jest.restoreAllMocks());

  it.each([true, false])("preserves a %s relationship result and the direction of the aliases", async (isFollower) => {
    const operation = jest.spyOn(FollowService.prototype, "getIsFollowerStatus").mockResolvedValue(isFollower);

    const response = await handler(request);

    expect(operation).toHaveBeenCalledTimes(1);
    expect(operation).toHaveBeenCalledWith(request.token, "@allen", "@amy");
    expect(response).toEqual({ success: true, message: null, isFollower });
  });

  it("supports service injection without constructing AWS dependencies", async () => {
    const service = { getIsFollowerStatus: jest.fn().mockResolvedValue(false) };
    await expect(new GetFollowingStatusLambda(service).handle(request)).resolves.toEqual({ success: true, message: null, isFollower: false });
    expect(service.getIsFollowerStatus).toHaveBeenCalledWith(request.token, request.followerAlias, request.followeeAlias);
    expect(composition.getFollowService).not.toHaveBeenCalled();
  });

  it("propagates service failures", async () => {
    jest.spyOn(FollowService.prototype, "getIsFollowerStatus").mockRejectedValue(new Error("Service failure"));

    await expect(handler(request)).rejects.toThrow("Service failure");
  });

  it("propagates authorization errors for the API's 401 mapping", async () => {
    jest.spyOn(FollowService.prototype, "getIsFollowerStatus").mockRejectedValue(new Error("[Unauthorized] Invalid or expired authentication token."));
    await expect(handler(request)).rejects.toThrow("[Unauthorized]");
  });

  it.each([
    ["missing request", undefined],
    ["null request", null],
    ["array request", []],
    ["missing token", { followerAlias: "@allen", followeeAlias: "@amy" }],
    ["blank token", { ...request, token: " " }],
    ["missing follower", { token: request.token, followeeAlias: "@amy" }],
    ["blank follower", { ...request, followerAlias: " " }],
    ["non-string follower", { ...request, followerAlias: 123 }],
    ["missing followee", { token: request.token, followerAlias: "@allen" }],
    ["blank followee", { ...request, followeeAlias: " " }],
    ["non-string followee", { ...request, followeeAlias: null }],
  ])("rejects %s before calling the service", async (_description, invalidRequest) => {
    const operation = jest.spyOn(FollowService.prototype, "getIsFollowerStatus");

    await expect(handler(invalidRequest)).rejects.toThrow("[Bad Request]");
    expect(operation).not.toHaveBeenCalled();
    expect(composition.getFollowService).not.toHaveBeenCalled();
  });
});
