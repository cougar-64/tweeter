/** @jest-environment node */
/// <reference types="node" />
// AI-assisted: see AI-ATTRIBUTION.md
import { handler, LogoutLambda } from "../../../tweeter-server/src/lambda/user/LogoutLambda";
import { UserService } from "../../../tweeter-server/src/model/service/UserService";
import * as composition from "../../../tweeter-server/src/lambda/config/getUserService";

const request = { token: "dummy-token" };

describe("Logout Lambda", () => {
  beforeEach(() => jest.spyOn(composition, "getUserService").mockReturnValue(new UserService()));
  afterEach(() => jest.restoreAllMocks());

  it("waits for server logout before reporting success and passes the token", async () => {
    let complete!: () => void;
    const pending = new Promise<void>((resolve) => { complete = resolve; });
    const operation = jest.spyOn(UserService.prototype, "logout").mockReturnValue(pending);
    let settled = false;
    const response = handler(request).then((result) => { settled = true; return result; });

    await Promise.resolve();
    expect(settled).toBe(false);
    expect(operation).toHaveBeenCalledWith(request.token);
    complete();
    await expect(response).resolves.toEqual({ success: true, message: null });
  });

  it("propagates server failures instead of reporting successful logout", async () => {
    jest.spyOn(UserService.prototype, "logout").mockRejectedValue(new Error("Logout failed"));

    await expect(handler(request)).rejects.toThrow("Logout failed");
  });

  it("propagates authorization failures for the API Gateway 401 mapping", async () => {
    jest.spyOn(UserService.prototype, "logout").mockRejectedValue(new Error("[Unauthorized] Invalid or expired authentication token."));
    await expect(handler(request)).rejects.toThrow("[Unauthorized] Invalid or expired authentication token.");
  });

  it("supports service injection without constructing AWS dependencies", async () => {
    const service = { logout: jest.fn().mockResolvedValue(undefined) };
    await expect(new LogoutLambda(service).handle(request)).resolves.toEqual({ success: true, message: null });
    expect(service.logout).toHaveBeenCalledWith(request.token);
    expect(composition.getUserService).not.toHaveBeenCalled();
  });

  it.each([
    ["missing request", undefined], ["null request", null], ["array request", []],
    ["string request", "dummy-token"], ["missing token", {}],
    ["blank token", { token: " " }], ["non-string token", { token: 123 }],
  ])("rejects %s before calling the service", async (_description, invalidRequest) => {
    const operation = jest.spyOn(UserService.prototype, "logout");

    await expect(handler(invalidRequest)).rejects.toThrow("[Bad Request]");
    expect(operation).not.toHaveBeenCalled();
    expect(composition.getUserService).not.toHaveBeenCalled();
  });
});
