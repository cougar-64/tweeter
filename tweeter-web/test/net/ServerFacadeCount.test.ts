// AI-assisted: see AI-ATTRIBUTION.md
import { CountResponse, UserAliasRequest } from "tweeter-shared";
import { ClientCommunicator } from "../../src/net/ClientCommunicator";
import { ServerFacade } from "../../src/net/ServerFacade";

const request = new UserAliasRequest("test-token", "@allen");

describe("ServerFacade count response validation", () => {
  afterEach(() => jest.restoreAllMocks());

  it("accepts zero followers", async () => {
    jest.spyOn(ClientCommunicator.prototype, "doPost").mockResolvedValue(new CountResponse(true, null, 0));

    await expect(new ServerFacade().getFollowerCount(request)).resolves.toBe(0);
  });

  it.each([-1, 1.5, NaN, Infinity])("rejects an invalid count of %s", async (count) => {
    jest.spyOn(ClientCommunicator.prototype, "doPost").mockResolvedValue(new CountResponse(true, null, count));

    await expect(new ServerFacade().getFollowerCount(request)).rejects.toThrow("Invalid follower count response.");
  });

  it("propagates an unsuccessful response's message", async () => {
    jest.spyOn(ClientCommunicator.prototype, "doPost").mockResolvedValue(new CountResponse(false, "Count unavailable", 0));

    await expect(new ServerFacade().getFollowerCount(request)).rejects.toThrow("Count unavailable");
  });
});
