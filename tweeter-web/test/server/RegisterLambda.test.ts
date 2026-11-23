/** @jest-environment node */
/// <reference types="node" />
// AI-assisted: see AI-ATTRIBUTION.md
import { AuthToken, User } from "tweeter-shared";
import { handler, RegisterLambda } from "../../../tweeter-server/src/lambda/user/RegisterLambda";
import { UserService } from "../../../tweeter-server/src/model/service/UserService";
import * as composition from "../../../tweeter-server/src/lambda/config/getUserService";

const request = {
  firstName: "Test", lastName: "User", alias: "@test-user", password: "dummy-password",
  imageStringBase64: "AQID/w==", imageFileExtension: "png",
};

describe("Register Lambda", () => {
  beforeEach(() => jest.spyOn(composition, "getUserService").mockReturnValue(new UserService()));
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

  it("supports service injection without constructing AWS dependencies", async () => {
    const user = new User("Test", "User", "@test-user", "https://example.com/profile.png");
    const token = new AuthToken("test-token", 123);
    const service = { register: jest.fn().mockResolvedValue([user, token]) };
    await expect(new RegisterLambda(service).handle(request)).resolves.toEqual({
      success: true, message: null, user: user.dto, authToken: token.dto,
    });
    expect(composition.getUserService).not.toHaveBeenCalled();
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
    expect(composition.getUserService).not.toHaveBeenCalled();
  });
});
