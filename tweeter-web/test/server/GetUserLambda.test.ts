/** @jest-environment node */
/// <reference types="node" />
// AI-assisted: see AI-ATTRIBUTION.md
import { User } from "tweeter-shared";
import { handler, GetUserLambda } from "../../../tweeter-server/src/lambda/user/GetUserLambda";
import { UserService } from "../../../tweeter-server/src/model/service/UserService";
import * as composition from "../../../tweeter-server/src/lambda/config/getUserService";

const request = { token: "test-token", userAlias: "@amy" };

describe("Get User Lambda", () => {
  beforeEach(() => jest.spyOn(composition, "getUserService").mockReturnValue(new UserService()));
  afterEach(() => jest.restoreAllMocks());

  it("delegates the token and alias and serializes the returned user as a DTO", async () => {
    const user = new User("Amy", "Ames", "@amy", "https://example.com/amy.png");
    const operation = jest.spyOn(UserService.prototype, "getUser").mockResolvedValue(user);

    await expect(handler(request)).resolves.toEqual({ success: true, message: null, user: user.dto });
    expect(operation).toHaveBeenCalledWith(request.token, request.userAlias);
  });

  it("supports injected services without constructing AWS dependencies", async () => {
    const user = new User("Amy", "Ames", "@amy", "https://example.com/amy.png");
    const service = { getUser: jest.fn().mockResolvedValue(user) };
    await expect(new GetUserLambda(service).handle(request)).resolves.toEqual({
      success: true, message: null, user: user.dto,
    });
    expect(service.getUser).toHaveBeenCalledWith(request.token, request.userAlias);
    expect(composition.getUserService).not.toHaveBeenCalled();
  });

  it("returns success with null when an alias does not exist", async () => {
    jest.spyOn(UserService.prototype, "getUser").mockResolvedValue(null);
    await expect(handler({ ...request, userAlias: "@no-such-user" }))
      .resolves.toEqual({ success: true, message: null, user: null });
  });

  it("propagates service failures", async () => {
    jest.spyOn(UserService.prototype, "getUser").mockRejectedValue(new Error("Lookup failed"));

    await expect(handler(request)).rejects.toThrow("Lookup failed");
  });

  it("propagates authorization failures for the API Gateway 401 mapping", async () => {
    jest.spyOn(UserService.prototype, "getUser").mockRejectedValue(new Error("[Unauthorized] Invalid or expired authentication token."));
    await expect(handler(request)).rejects.toThrow("[Unauthorized] Invalid or expired authentication token.");
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
    expect(composition.getUserService).not.toHaveBeenCalled();
  });
});
