// AI-assisted: see AI-ATTRIBUTION.md
import { AuthToken, CountResponse, User, UserAliasRequest } from "tweeter-shared";
import { ClientCommunicator } from "../../src/net/ClientCommunicator";
import { ServerFacade } from "../../src/net/ServerFacade";
import { FollowService } from "../../src/model.service/FollowService";

const request = new UserAliasRequest("test-token", "@allen");

describe.each([
  ["follower", "getFollowerCount", "/followers/count"],
  ["followee", "getFolloweeCount", "/followees/count"],
] as const)("%s count client validation", (feature, method, endpoint) => {
  afterEach(() => jest.restoreAllMocks());

  it("accepts a zero count and uses the correct endpoint", async () => {
    const operation = jest.spyOn(ClientCommunicator.prototype, "doPost")
      .mockResolvedValue(new CountResponse(true, null, 0));

    await expect(new ServerFacade()[method](request)).resolves.toBe(0);
    expect(operation).toHaveBeenCalledWith(request, endpoint);
  });

  it("converts domain inputs and calls the matching facade method", async () => {
    const facade = new ServerFacade();
    const operation = jest.spyOn(facade, method).mockResolvedValue(0);
    const service = new FollowService(facade);
    const user = new User("Allen", "Anderson", "@allen", "https://example.com/allen.png");

    await expect(service[method](new AuthToken("test-token", Date.now()), user)).resolves.toBe(0);
    expect(operation).toHaveBeenCalledWith(new UserAliasRequest("test-token", "@allen"));
  });

  it.each([-1, 1.5, NaN, Infinity])("rejects an invalid count of %s", async (count) => {
    jest.spyOn(ClientCommunicator.prototype, "doPost").mockResolvedValue(new CountResponse(true, null, count));

    await expect(new ServerFacade()[method](request)).rejects.toThrow(`Invalid ${feature} count response.`);
  });

  it("propagates an unsuccessful response's message", async () => {
    jest.spyOn(ClientCommunicator.prototype, "doPost").mockResolvedValue(new CountResponse(false, "Count unavailable", 0));

    await expect(new ServerFacade()[method](request)).rejects.toThrow("Count unavailable");
  });
});
