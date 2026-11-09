// AI-assisted: see AI-ATTRIBUTION.md
import { AuthToken, TweeterResponse, User, UserAliasRequest } from "tweeter-shared";
import { FollowService } from "../../src/model.service/FollowService";
import { ClientCommunicator } from "../../src/net/ClientCommunicator";
import { ServerFacade } from "../../src/net/ServerFacade";

const request = new UserAliasRequest("test-token", "@amy");

describe("Follow client networking", () => {
  afterEach(() => jest.restoreAllMocks());

  it("posts to the follow endpoint and resolves without a payload", async () => {
    const operation = jest.spyOn(ClientCommunicator.prototype, "doPost")
      .mockResolvedValue(new TweeterResponse(true));

    await expect(new ServerFacade().follow(request)).resolves.toBeUndefined();
    expect(operation).toHaveBeenCalledWith(request, "/follow");
  });

  it.each([
    ["Follow unavailable", "Follow unavailable"],
    [null, "Failed to follow user."],
  ] as const)("rejects an unsuccessful operation with message %p", async (message, expected) => {
    jest.spyOn(ClientCommunicator.prototype, "doPost")
      .mockResolvedValue(new TweeterResponse(false, message));

    await expect(new ServerFacade().follow(request)).rejects.toThrow(expected);
  });

  it("propagates HTTP or transport failures", async () => {
    jest.spyOn(ClientCommunicator.prototype, "doPost").mockRejectedValue(new Error("HTTP failure"));

    await expect(new ServerFacade().follow(request)).rejects.toThrow("HTTP failure");
  });

  it("sends the target alias from the domain object and propagates facade failures", async () => {
    const facade = new ServerFacade();
    const operation = jest.spyOn(facade, "follow").mockRejectedValue(new Error("Follow failed"));
    const service = new FollowService(facade);
    const target = new User("Amy", "Ames", "@amy", "https://example.com/amy.png");

    await expect(service.follow(new AuthToken(request.token, Date.now()), target)).rejects.toThrow("Follow failed");
    expect(operation).toHaveBeenCalledWith(request);
  });
});
