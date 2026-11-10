// AI-assisted: see AI-ATTRIBUTION.md
import { AuthToken, PostStatusRequest, Status, TweeterResponse, User } from "tweeter-shared";
import { StatusService } from "../../src/model.service/StatusService";
import { ClientCommunicator } from "../../src/net/ClientCommunicator";
import { ServerFacade } from "../../src/net/ServerFacade";

const status = new Status("Hello @amy! https://byu.edu", new User("Allen", "Anderson", "@allen", "image.png"), 0);
const request = new PostStatusRequest("dummy-token", status.dto);

describe("Post Status client networking", () => {
  afterEach(() => jest.restoreAllMocks());

  it("posts to the status endpoint and resolves without additional data", async () => {
    const operation = jest.spyOn(ClientCommunicator.prototype, "doPost").mockResolvedValue(new TweeterResponse(true));

    await expect(new ServerFacade().postStatus(request)).resolves.toBeUndefined();
    expect(operation).toHaveBeenCalledWith(request, "/status/post");
  });

  it.each([["Posting unavailable", "Posting unavailable"], [null, "Failed to post status."]] as const)(
    "rejects an unsuccessful operation with message %p", async (message, expected) => {
      jest.spyOn(ClientCommunicator.prototype, "doPost").mockResolvedValue(new TweeterResponse(false, message));

      await expect(new ServerFacade().postStatus(request)).rejects.toThrow(expected);
    }
  );

  it("propagates transport failures", async () => {
    jest.spyOn(ClientCommunicator.prototype, "doPost").mockRejectedValue(new Error("HTTP failure"));

    await expect(new ServerFacade().postStatus(request)).rejects.toThrow("HTTP failure");
  });

  it("converts domain objects to a token and nested status DTO without serialized segments", async () => {
    const facade = new ServerFacade();
    const operation = jest.spyOn(facade, "postStatus").mockResolvedValue(undefined);

    await expect(new StatusService(facade).postStatus(new AuthToken(request.token, Date.now()), status))
      .resolves.toBeUndefined();
    expect(operation).toHaveBeenCalledWith(request);
    expect(JSON.parse(JSON.stringify(operation.mock.calls[0][0]))).toEqual({
      token: "dummy-token",
      status: { post: status.post, user: status.user.dto, timestamp: 0 },
    });
  });

  it("propagates facade failures to the presenter through the service", async () => {
    const facade = new ServerFacade();
    jest.spyOn(facade, "postStatus").mockRejectedValue(new Error("Posting failed"));

    await expect(new StatusService(facade).postStatus(new AuthToken(request.token, 0), status)).rejects.toThrow("Posting failed");
  });
});
