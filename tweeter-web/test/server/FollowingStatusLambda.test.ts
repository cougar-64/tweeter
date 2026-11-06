// AI-assisted: see AI-ATTRIBUTION.md
import { handler } from "../../../tweeter-server/src/lambda/follow/GetFollowingStatusLambda";
import { FollowService } from "../../../tweeter-server/src/model/service/FollowService";

const request = { token: "test-token", followerAlias: "@allen", followeeAlias: "@amy" };

describe("Following status Lambda", () => {
  afterEach(() => jest.restoreAllMocks());

  it.each([true, false])("preserves a %s relationship result and the direction of the aliases", async (isFollower) => {
    const operation = jest.spyOn(FollowService.prototype, "getIsFollowerStatus").mockResolvedValue(isFollower);

    const response = await handler(request);

    expect(operation).toHaveBeenCalledTimes(1);
    expect(operation).toHaveBeenCalledWith(request.token, "@allen", "@amy");
    expect(response).toEqual({ success: true, message: null, isFollower });
  });

  it("returns a boolean from FakeData", async () => {
    const response = await handler(request);

    expect(response.success).toBe(true);
    expect(response.message).toBeNull();
    expect(typeof response.isFollower).toBe("boolean");
  });

  it("propagates service failures", async () => {
    jest.spyOn(FollowService.prototype, "getIsFollowerStatus").mockRejectedValue(new Error("Service failure"));

    await expect(handler(request)).rejects.toThrow("Service failure");
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
  });
});
