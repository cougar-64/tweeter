/** @jest-environment node */
/// <reference types="node" />
// AI-assisted: see AI-ATTRIBUTION.md
import { AuthToken, User } from "tweeter-shared";
import { handler, LoginLambda } from "../../../tweeter-server/src/lambda/user/LoginLambda";
import { UserService } from "../../../tweeter-server/src/model/service/UserService";
import * as composition from "../../../tweeter-server/src/lambda/config/getUserService";

const request = { alias: "@allen", password: "dummy-password" };

describe("Login Lambda", () => {
  beforeEach(() => jest.spyOn(composition, "getUserService").mockReturnValue(new UserService()));
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

  it("supports injected services without constructing AWS dependencies", async () => {
    const user = new User("Amy", "Ames", "@amy", "https://example.com/amy.png");
    const token = new AuthToken("test-token", 123);
    const service = { login: jest.fn().mockResolvedValue([user, token]) };
    await expect(new LoginLambda(service).handle(request)).resolves.toEqual({
      success: true, message: null, user: user.dto, authToken: token.dto,
    });
    expect(composition.getUserService).not.toHaveBeenCalled();
  });

  it("propagates the unauthorized prefix for API Gateway", async () => {
    jest.spyOn(UserService.prototype, "login").mockRejectedValue(new Error("[Unauthorized] Invalid alias or password."));
    await expect(handler(request)).rejects.toThrow("[Unauthorized] Invalid alias or password.");
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
    expect(composition.getUserService).not.toHaveBeenCalled();
  });
});
