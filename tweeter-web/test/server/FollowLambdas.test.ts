// AI-assisted: see AI-ATTRIBUTION.md
import { User } from "tweeter-shared";
import { FollowService } from "../../../tweeter-server/src/model/service/FollowService";
import { handler as getFollowers } from "../../../tweeter-server/src/lambda/follow/GetFollowersLambda";
import { handler as getFollowees } from "../../../tweeter-server/src/lambda/follow/GetFolloweesLambda";

const firstPageRequest = {
  token: "milestone-3-test-token",
  userAlias: "@allen",
  pageSize: 10,
  lastItem: null,
};

describe.each([
  ["followers", getFollowers, "loadMoreFollowers"],
  ["followees", getFollowees, "loadMoreFollowees"],
] as const)("%s Lambda", (_feature, handler, serviceMethod) => {
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

  it("returns a first page of user DTOs", async () => {
    const response = await handler(firstPageRequest);

    expect(response.success).toBe(true);
    expect(response.message).toBeNull();
    expect(response.items).toHaveLength(10);
    expect(response.items[0]).toMatchObject({ firstName: "Amy", lastName: "Ames", alias: "@amy" });
    expect(response.items[9].alias).toBe("@frank");
    expect(response.hasMore).toBe(true);
  });

  it("accepts a JSON cursor and retrieves the following page", async () => {
    const firstPage = await handler(firstPageRequest);
    const nextRequest = JSON.parse(JSON.stringify({ ...firstPageRequest, lastItem: firstPage.items[9] }));
    const response = await handler(nextRequest);

    expect(response.items).toHaveLength(10);
    expect(response.items[0].alias).toBe("@fran");
    expect(response.items[9].alias).toBe("@kent");
    expect(response.hasMore).toBe(true);
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
  });
});
