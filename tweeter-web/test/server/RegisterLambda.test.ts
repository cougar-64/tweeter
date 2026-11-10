// AI-assisted: see AI-ATTRIBUTION.md
import { AuthToken, FakeData, User } from "tweeter-shared";
import { handler } from "../../../tweeter-server/src/lambda/user/RegisterLambda";
import { UserService } from "../../../tweeter-server/src/model/service/UserService";

const request = {
  firstName: "Test", lastName: "User", alias: "@test-user", password: "dummy-password",
  imageStringBase64: "AQID/w==", imageFileExtension: "png",
};

describe("Register Lambda", () => {
  afterEach(() => jest.restoreAllMocks());

  it("passes all registration fields to register and returns user/token DTOs", async () => {
    const user = new User("Amy", "Ames", "@amy", "https://example.com/amy.png");
    const token = new AuthToken("dummy-token", 123456789);
    const operation = jest.spyOn(UserService.prototype, "register").mockResolvedValue([user, token]);
    const login = jest.spyOn(UserService.prototype, "login");

    await expect(handler(request)).resolves.toEqual({ success: true, message: null, user: user.dto, authToken: token.dto });
    expect(operation).toHaveBeenCalledWith(
      request.firstName, request.lastName, request.alias, request.password,
      request.imageStringBase64, request.imageFileExtension
    );
    expect(login).not.toHaveBeenCalled();
  });

  it("preserves dummy registration without storing the requested user or image", async () => {
    const response = await handler(request);

    expect(response.success).toBe(true);
    expect(response.user).toEqual(FakeData.instance.firstUser!.dto);
    expect(response.user.alias).toBe("@allen");
    expect(response.authToken).toEqual(FakeData.instance.authToken.dto);
    expect(FakeData.instance.findUserByAlias(request.alias)).toBeNull();
  });

  it("rejects registration if FakeData has no first user", async () => {
    jest.spyOn(FakeData.instance, "firstUser", "get").mockReturnValue(null);

    await expect(handler(request)).rejects.toThrow("Invalid registration");
  });

  it("propagates service failures", async () => {
    jest.spyOn(UserService.prototype, "register").mockRejectedValue(new Error("Register unavailable"));

    await expect(handler(request)).rejects.toThrow("Register unavailable");
  });

  it.each<[string, unknown]>([
    ["missing request", undefined], ["null request", null], ["array request", []],
    ["missing alias", { ...request, alias: undefined }], ["blank alias", { ...request, alias: " " }],
    ["non-string alias", { ...request, alias: 123 }],
    ["missing password", { ...request, password: undefined }], ["blank password", { ...request, password: " " }],
    ["non-string password", { ...request, password: null }],
    ...(["firstName", "lastName", "imageStringBase64", "imageFileExtension"] as const).flatMap((field): [string, unknown][] => [
      [`missing ${field}`, { ...request, [field]: undefined }],
      [`blank ${field}`, { ...request, [field]: " " }],
      [`non-string ${field}`, { ...request, [field]: 123 }],
    ]),
    ["malformed Base64 image", { ...request, imageStringBase64: "not-base64!" }],
  ])("rejects %s before calling the service", async (_description, invalidRequest) => {
    const operation = jest.spyOn(UserService.prototype, "register");

    await expect(handler(invalidRequest)).rejects.toThrow("[Bad Request]");
    expect(operation).not.toHaveBeenCalled();
  });
});
