// AI-assisted: see AI-ATTRIBUTION.md
import { handler as getFollowerCount } from "../../../tweeter-server/src/lambda/follow/GetFollowerCountLambda";
import { handler as getFolloweeCount } from "../../../tweeter-server/src/lambda/follow/GetFolloweeCountLambda";
import { FollowService } from "../../../tweeter-server/src/model/service/FollowService";

const request = { token: "milestone-3-test-token", userAlias: "@allen" };

describe.each([
  ["Follower", getFollowerCount, "getFollowerCount"],
  ["Followee", getFolloweeCount, "getFolloweeCount"],
] as const)("%s count Lambda", (_feature, handler, serviceMethod) => {
  afterEach(() => jest.restoreAllMocks());

  it("returns a whole-number FakeData count from 1 to 10", async () => {
    const response = await handler(request);

    expect(response.success).toBe(true);
    expect(response.message).toBeNull();
    expect(Number.isInteger(response.count)).toBe(true);
    expect(response.count).toBeGreaterThanOrEqual(1);
    expect(response.count).toBeLessThanOrEqual(10);
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
  });
});
