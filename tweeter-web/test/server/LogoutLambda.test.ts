// AI-assisted: see AI-ATTRIBUTION.md
import { handler } from "../../../tweeter-server/src/lambda/user/LogoutLambda";
import { UserService } from "../../../tweeter-server/src/model/service/UserService";

const request = { token: "dummy-token" };

describe("Logout Lambda", () => {
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

  it.each([
    ["missing request", undefined], ["null request", null], ["array request", []],
    ["string request", "dummy-token"], ["missing token", {}],
    ["blank token", { token: " " }], ["non-string token", { token: 123 }],
  ])("rejects %s before calling the service", async (_description, invalidRequest) => {
    const operation = jest.spyOn(UserService.prototype, "logout");

    await expect(handler(invalidRequest)).rejects.toThrow("[Bad Request]");
    expect(operation).not.toHaveBeenCalled();
  });
});
