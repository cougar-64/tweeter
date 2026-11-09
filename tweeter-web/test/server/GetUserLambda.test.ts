// AI-assisted: see AI-ATTRIBUTION.md
import { User } from "tweeter-shared";
import { handler } from "../../../tweeter-server/src/lambda/user/GetUserLambda";
import { UserService } from "../../../tweeter-server/src/model/service/UserService";

const request = { token: "test-token", userAlias: "@amy" };

describe("Get User Lambda", () => {
  afterEach(() => jest.restoreAllMocks());

  it("delegates the token and alias and serializes the returned user as a DTO", async () => {
    const user = new User("Amy", "Ames", "@amy", "https://example.com/amy.png");
    const operation = jest.spyOn(UserService.prototype, "getUser").mockResolvedValue(user);

    await expect(handler(request)).resolves.toEqual({ success: true, message: null, user: user.dto });
    expect(operation).toHaveBeenCalledWith(request.token, request.userAlias);
  });

  it("looks up the requested FakeData user", async () => {
    const response = await handler(request);

    expect(response.success).toBe(true);
    expect(response.user).toEqual({
      firstName: "Amy", lastName: "Ames", alias: "@amy",
      imageUrl: "https://faculty.cs.byu.edu/~jwilkerson/cs340/tweeter/images/daisy_duck.png",
    });
  });

  it("returns success with null when an alias does not exist", async () => {
    await expect(handler({ ...request, userAlias: "@no-such-user" }))
      .resolves.toEqual({ success: true, message: null, user: null });
  });

  it("propagates service failures", async () => {
    jest.spyOn(UserService.prototype, "getUser").mockRejectedValue(new Error("Lookup failed"));

    await expect(handler(request)).rejects.toThrow("Lookup failed");
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
    const operation = jest.spyOn(UserService.prototype, "getUser");

    await expect(handler(invalidRequest)).rejects.toThrow("[Bad Request]");
    expect(operation).not.toHaveBeenCalled();
  });
});
