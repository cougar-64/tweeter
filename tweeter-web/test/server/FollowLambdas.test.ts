/** @jest-environment node */
/// <reference types="node" />
// AI-assisted: see AI-ATTRIBUTION.md
import { User } from "tweeter-shared";
import { FollowService } from "../../../tweeter-server/src/model/service/FollowService";
import { handler as getFollowers } from "../../../tweeter-server/src/lambda/follow/GetFollowersLambda";
import { handler as getFollowees } from "../../../tweeter-server/src/lambda/follow/GetFolloweesLambda";
import { GetFollowersLambda } from "../../../tweeter-server/src/lambda/follow/GetFollowersLambda";
import { GetFolloweesLambda } from "../../../tweeter-server/src/lambda/follow/GetFolloweesLambda";
import * as composition from "../../../tweeter-server/src/lambda/config/getFollowService";

const firstPageRequest = {
  token: "milestone-3-test-token",
  userAlias: "@allen",
  pageSize: 10,
  lastItem: null,
};

describe.each([
  ["followers", getFollowers, "loadMoreFollowers", GetFollowersLambda],
  ["followees", getFollowees, "loadMoreFollowees", GetFolloweesLambda],
] as const)("%s Lambda", (_feature, handler, serviceMethod, Lambda) => {
  beforeEach(() => jest.spyOn(composition, "getFollowService").mockReturnValue(new FollowService()));
  afterEach(() => jest.restoreAllMocks());

  it("calls its own service method with a reconstructed cursor and converts the result", async () => {
    const cursor = new User("Amy", "Ames", "@amy", "https://example.com/amy.png");
    const returnedUser = new User("Fran", "Franklin", "@fran", "https://example.com/fran.png");
    const operation = jest.spyOn(FollowService.prototype, serviceMethod)
      .mockResolvedValue([[returnedUser], false]);

    const response = await handler({ ...firstPageRequest, lastItem: cursor.dto });

    expect(operation).toHaveBeenCalledTimes(1);
    expect(operation).toHaveBeenCalledWith(
      firstPageRequest.token, firstPageRequest.userAlias, firstPageRequest.pageSize, expect.any(User)
    );
    expect(operation.mock.calls[0][3]?.dto).toEqual(cursor.dto);
    expect(response).toEqual({ success: true, message: null, items: [returnedUser.dto], hasMore: false });
  });

  it("propagates service failures for API Gateway error handling", async () => {
    jest.spyOn(FollowService.prototype, serviceMethod).mockRejectedValue(new Error("Service failure"));

    await expect(handler(firstPageRequest)).rejects.toThrow("Service failure");
  });

  it("supports service injection through the shared pagination base", async () => {
    const user = new User("Amy", "Ames", "@amy", "https://example.com/amy.png");
    const service = {
      loadMoreFollowers: jest.fn().mockResolvedValue([[user], true]),
      loadMoreFollowees: jest.fn().mockResolvedValue([[user], true]),
    };
    await expect(new Lambda(service).handle(firstPageRequest)).resolves.toEqual({
      success: true, message: null, items: [user.dto], hasMore: true,
    });
    expect(service[serviceMethod]).toHaveBeenCalledWith(firstPageRequest.token, firstPageRequest.userAlias, 10, null);
    expect(composition.getFollowService).not.toHaveBeenCalled();
  });

  it("accepts a JSON cursor and retrieves the following page", async () => {
    const first = new User("Amy", "Ames", "@amy", "https://example.com/amy.png");
    const next = new User("Bob", "Brown", "@bob", "https://example.com/bob.png");
    const operation = jest.spyOn(FollowService.prototype, serviceMethod)
      .mockResolvedValueOnce([[first], true]).mockResolvedValueOnce([[next], false]);
    const firstPage = await handler(firstPageRequest);
    const nextRequest = JSON.parse(JSON.stringify({ ...firstPageRequest, lastItem: firstPage.items[0] }));
    const response = await handler(nextRequest);

    expect(response.items).toEqual([next.dto]);
    expect(operation.mock.calls[1][3]?.dto).toEqual(first.dto);
    expect(response.hasMore).toBe(false);
  });

  it("propagates authorization errors for the API's 401 mapping", async () => {
    jest.spyOn(FollowService.prototype, serviceMethod).mockRejectedValue(new Error("[Unauthorized] Invalid or expired authentication token."));
    await expect(handler(firstPageRequest)).rejects.toThrow("[Unauthorized]");
  });

  it.each([
    ["missing request", undefined],
    ["array request", []],
    ["blank token", { ...firstPageRequest, token: " " }],
    ["blank alias", { ...firstPageRequest, userAlias: " " }],
    ["zero page size", { ...firstPageRequest, pageSize: 0 }],
    ["fractional page size", { ...firstPageRequest, pageSize: 1.5 }],
    ["missing cursor", { ...firstPageRequest, lastItem: undefined }],
    ["malformed user DTO", { ...firstPageRequest, lastItem: {} }],
  ])("rejects %s", async (_description, request) => {
    await expect(handler(request)).rejects.toThrow("[Bad Request]");
    expect(composition.getFollowService).not.toHaveBeenCalled();
  });
});
