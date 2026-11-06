// AI-assisted: see AI-ATTRIBUTION.md
import { AuthToken, FollowingStatusRequest, FollowingStatusResponse, User } from "tweeter-shared";
import { FollowService } from "../../src/model.service/FollowService";
import { ClientCommunicator } from "../../src/net/ClientCommunicator";
import { ServerFacade } from "../../src/net/ServerFacade";

const request = new FollowingStatusRequest("test-token", "@allen", "@amy");

describe("Following status client validation", () => {
  afterEach(() => jest.restoreAllMocks());

  it.each([true, false])("accepts a successful %s relationship result", async (isFollower) => {
    const operation = jest.spyOn(ClientCommunicator.prototype, "doPost")
      .mockResolvedValue(new FollowingStatusResponse(true, null, isFollower));

    await expect(new ServerFacade().getIsFollowerStatus(request)).resolves.toBe(isFollower);
    expect(operation).toHaveBeenCalledWith(request, "/follow/status");
  });

  it.each([undefined, null, 0, 1, "false"])("rejects a non-boolean result of %p", async (isFollower) => {
    const invalidResponse = { success: true, message: null, isFollower };
    jest.spyOn(ClientCommunicator.prototype, "doPost").mockResolvedValue(invalidResponse);

    await expect(new ServerFacade().getIsFollowerStatus(request)).rejects.toThrow("Invalid following status response.");
  });

  it("distinguishes an unsuccessful operation from a false relationship result", async () => {
    jest.spyOn(ClientCommunicator.prototype, "doPost")
      .mockResolvedValue(new FollowingStatusResponse(false, "Status unavailable", false));

    await expect(new ServerFacade().getIsFollowerStatus(request)).rejects.toThrow("Status unavailable");
  });

  it("sends the current user as follower and the viewed user as followee", async () => {
    const facade = new ServerFacade();
    const operation = jest.spyOn(facade, "getIsFollowerStatus").mockResolvedValue(false);
    const service = new FollowService(facade);
    const currentUser = new User("Allen", "Anderson", "@allen", "https://example.com/allen.png");
    const viewedUser = new User("Amy", "Ames", "@amy", "https://example.com/amy.png");

    await expect(service.getIsFollowerStatus(new AuthToken("test-token", Date.now()), currentUser, viewedUser))
      .resolves.toBe(false);
    expect(operation).toHaveBeenCalledWith(request);
  });
});
