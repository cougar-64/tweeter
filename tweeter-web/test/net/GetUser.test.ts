// AI-assisted: see AI-ATTRIBUTION.md
import { AuthToken, GetUserResponse, User, UserAliasRequest } from "tweeter-shared";
import { UserService } from "../../src/model.service/UserService";
import { ClientCommunicator } from "../../src/net/ClientCommunicator";
import { ServerFacade } from "../../src/net/ServerFacade";

const request = new UserAliasRequest("test-token", "@amy");
const dto = { firstName: "Amy", lastName: "Ames", alias: "@amy", imageUrl: "https://example.com/amy.png" };

describe("Get User client networking", () => {
  afterEach(() => jest.restoreAllMocks());

  it("calls the lookup endpoint and reconstructs a User with working domain methods", async () => {
    const operation = jest.spyOn(ClientCommunicator.prototype, "doPost")
      .mockResolvedValue(new GetUserResponse(true, null, dto));

    const result = await new ServerFacade().getUser(request);

    expect(operation).toHaveBeenCalledWith(request, "/user/get");
    expect(result).toBeInstanceOf(User);
    expect(result!.name).toBe("Amy Ames");
    expect(result!.equals(User.fromDto(dto))).toBe(true);
    expect(result!.dto).toEqual(dto);
  });

  it("preserves an explicit null user for a successful lookup with no match", async () => {
    jest.spyOn(ClientCommunicator.prototype, "doPost").mockResolvedValue(new GetUserResponse(true, null, null));

    await expect(new ServerFacade().getUser(request)).resolves.toBeNull();
  });

  it.each([undefined, {}, "@amy", [], { ...dto, firstName: 123 }, { ...dto, imageUrl: undefined }])(
    "rejects a malformed or missing user of %p", async (user) => {
      const invalidResponse = { success: true, message: null, user };
      jest.spyOn(ClientCommunicator.prototype, "doPost").mockResolvedValue(invalidResponse);

      await expect(new ServerFacade().getUser(request)).rejects.toThrow("Invalid get user response.");
    }
  );

  it.each([["Lookup unavailable", "Lookup unavailable"], [null, "Failed to get user."]] as const)(
    "rejects an unsuccessful operation with message %p", async (message, expected) => {
      jest.spyOn(ClientCommunicator.prototype, "doPost").mockResolvedValue(new GetUserResponse(false, message, null));

      await expect(new ServerFacade().getUser(request)).rejects.toThrow(expected);
    }
  );

  it("propagates HTTP or transport failures", async () => {
    jest.spyOn(ClientCommunicator.prototype, "doPost").mockRejectedValue(new Error("HTTP failure"));

    await expect(new ServerFacade().getUser(request)).rejects.toThrow("HTTP failure");
  });

  it("passes the token and requested alias through the client service", async () => {
    const facade = new ServerFacade();
    const user = User.fromDto(dto);
    const operation = jest.spyOn(facade, "getUser").mockResolvedValue(user);

    await expect(new UserService(facade).getUser(new AuthToken(request.token, Date.now()), request.userAlias))
      .resolves.toBe(user);
    expect(operation).toHaveBeenCalledWith(request);
  });

  it("preserves null through the client service", async () => {
    const facade = new ServerFacade();
    jest.spyOn(facade, "getUser").mockResolvedValue(null);

    await expect(new UserService(facade).getUser(new AuthToken(request.token, Date.now()), "@no-such-user"))
      .resolves.toBeNull();
  });
});
