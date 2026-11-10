// AI-assisted: see AI-ATTRIBUTION.md
import { AuthenticatedRequest, AuthToken, TweeterResponse } from "tweeter-shared";
import { UserService } from "../../src/model.service/UserService";
import { ClientCommunicator } from "../../src/net/ClientCommunicator";
import { ServerFacade } from "../../src/net/ServerFacade";

const request = new AuthenticatedRequest("dummy-token");

describe("Logout client networking", () => {
  afterEach(() => jest.restoreAllMocks());

  it("posts a token-only request and resolves without additional data", async () => {
    const operation = jest.spyOn(ClientCommunicator.prototype, "doPost").mockResolvedValue(new TweeterResponse(true));

    await expect(new ServerFacade().logout(request)).resolves.toBeUndefined();
    expect(operation).toHaveBeenCalledWith(request, "/user/logout");
    expect(JSON.parse(JSON.stringify(request))).toEqual({ token: "dummy-token" });
  });

  it.each([["Logout unavailable", "Logout unavailable"], [null, "Failed to logout user."]] as const)(
    "rejects an unsuccessful operation with message %p", async (message, expected) => {
      jest.spyOn(ClientCommunicator.prototype, "doPost").mockResolvedValue(new TweeterResponse(false, message));

      await expect(new ServerFacade().logout(request)).rejects.toThrow(expected);
    }
  );

  it("propagates HTTP or transport failures", async () => {
    jest.spyOn(ClientCommunicator.prototype, "doPost").mockRejectedValue(new Error("HTTP failure"));

    await expect(new ServerFacade().logout(request)).rejects.toThrow("HTTP failure");
  });

  it("converts the domain token in the client service and calls the facade", async () => {
    const facade = new ServerFacade();
    const operation = jest.spyOn(facade, "logout").mockResolvedValue(undefined);

    await expect(new UserService(facade).logout(new AuthToken(request.token, Date.now()))).resolves.toBeUndefined();
    expect(operation).toHaveBeenCalledWith(request);
  });

  it("propagates facade failures to the presenter through the service", async () => {
    const facade = new ServerFacade();
    jest.spyOn(facade, "logout").mockRejectedValue(new Error("Logout failed"));

    await expect(new UserService(facade).logout(new AuthToken(request.token, Date.now()))).rejects.toThrow("Logout failed");
  });
});
