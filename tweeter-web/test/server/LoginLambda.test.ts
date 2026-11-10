// AI-assisted: see AI-ATTRIBUTION.md
import { AuthToken, FakeData, User } from "tweeter-shared";
import { handler } from "../../../tweeter-server/src/lambda/user/LoginLambda";
import { UserService } from "../../../tweeter-server/src/model/service/UserService";

const request = { alias: "@allen", password: "dummy-password" };

describe("Login Lambda", () => {
  afterEach(() => jest.restoreAllMocks());

  it("passes credentials unchanged and returns plain user/token DTOs", async () => {
    const user = new User("Amy", "Ames", "@amy", "https://example.com/amy.png");
    const token = new AuthToken("dummy-token", 123456789);
    const operation = jest.spyOn(UserService.prototype, "login").mockResolvedValue([user, token]);

    await expect(handler(request)).resolves.toEqual({
      success: true, message: null, user: user.dto, authToken: { token: "dummy-token", timestamp: 123456789 },
    });
    expect(operation).toHaveBeenCalledWith(request.alias, request.password);
  });

  it("preserves dummy login behavior for arbitrary nonempty credentials", async () => {
    const response = await handler({ alias: "@another-user", password: "dummy-password" });

    expect(response.success).toBe(true);
    expect(response.user.alias).toBe("@allen");
    expect(response.user.firstName).toBe("Allen");
    expect(response.user.lastName).toBe("Anderson");
    expect(response.authToken).toEqual(FakeData.instance.authToken.dto);
  });

  it("rejects login if FakeData has no first user", async () => {
    jest.spyOn(FakeData.instance, "firstUser", "get").mockReturnValue(null);

    await expect(handler(request)).rejects.toThrow("Invalid alias or password");
  });

  it("propagates service failures", async () => {
    jest.spyOn(UserService.prototype, "login").mockRejectedValue(new Error("Login unavailable"));

    await expect(handler(request)).rejects.toThrow("Login unavailable");
  });

  it.each([
    ["missing request", undefined],
    ["null request", null],
    ["array request", []],
    ["missing alias", { password: request.password }],
    ["blank alias", { ...request, alias: " " }],
    ["non-string alias", { ...request, alias: 123 }],
    ["missing password", { alias: request.alias }],
    ["blank password", { ...request, password: " " }],
    ["non-string password", { ...request, password: null }],
  ])("rejects %s before calling the service", async (_description, invalidRequest) => {
    const operation = jest.spyOn(UserService.prototype, "login");

    await expect(handler(invalidRequest)).rejects.toThrow("[Bad Request]");
    expect(operation).not.toHaveBeenCalled();
  });
});
