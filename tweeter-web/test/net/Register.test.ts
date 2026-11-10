// AI-assisted: see AI-ATTRIBUTION.md
import { AuthenticationResponse, AuthToken, RegisterRequest, User } from "tweeter-shared";
import { UserService } from "../../src/model.service/UserService";
import { ClientCommunicator } from "../../src/net/ClientCommunicator";
import { ServerFacade } from "../../src/net/ServerFacade";

const request = new RegisterRequest("Test", "User", "@test-user", "dummy-password", "AQID/w==", "png");
const userDto = { firstName: "Allen", lastName: "Anderson", alias: "@allen", imageUrl: "https://example.com/allen.png" };
const tokenDto = { token: "dummy-token", timestamp: 123456789 };

describe("Register client networking", () => {
  afterEach(() => jest.restoreAllMocks());

  it("uses the registration endpoint and reconstructs user/token domain objects", async () => {
    const operation = jest.spyOn(ClientCommunicator.prototype, "doPost")
      .mockResolvedValue(new AuthenticationResponse(true, null, userDto, tokenDto));

    const [user, token] = await new ServerFacade().register(request);

    expect(operation).toHaveBeenCalledWith(request, "/user/register");
    expect(user).toBeInstanceOf(User);
    expect(user.name).toBe("Allen Anderson");
    expect(user.dto).toEqual(userDto);
    expect(token).toBeInstanceOf(AuthToken);
    expect(token.dto).toEqual(tokenDto);
  });

  it.each([undefined, null, {}])("rejects malformed user data of %p", async (user) => {
    const response = { success: true, message: null, user, authToken: tokenDto };
    jest.spyOn(ClientCommunicator.prototype, "doPost").mockResolvedValue(response);

    await expect(new ServerFacade().register(request)).rejects.toThrow("Invalid register response.");
  });

  it.each([undefined, null, { ...tokenDto, token: " " }, { ...tokenDto, timestamp: "123" }])(
    "rejects malformed token data of %p", async (authToken) => {
      const response = { success: true, message: null, user: userDto, authToken };
      jest.spyOn(ClientCommunicator.prototype, "doPost").mockResolvedValue(response);

      await expect(new ServerFacade().register(request)).rejects.toThrow("Invalid register response.");
    }
  );

  it.each([["Register unavailable", "Register unavailable"], [null, "Failed to register."]] as const)(
    "propagates an unsuccessful operation with message %p", async (message, expected) => {
      const response = { success: false, message };
      jest.spyOn(ClientCommunicator.prototype, "doPost").mockResolvedValue(response);

      await expect(new ServerFacade().register(request)).rejects.toThrow(expected);
    }
  );

  it("propagates transport failures", async () => {
    jest.spyOn(ClientCommunicator.prototype, "doPost").mockRejectedValue(new Error("HTTP failure"));

    await expect(new ServerFacade().register(request)).rejects.toThrow("HTTP failure");
  });

  it("encodes image bytes as Base64 and preserves all fields through JSON", async () => {
    const facade = new ServerFacade();
    const result: [User, AuthToken] = [User.fromDto(userDto), AuthToken.fromDto(tokenDto)];
    const operation = jest.spyOn(facade, "register").mockResolvedValue(result);

    await expect(new UserService(facade).register(
      request.firstName, request.lastName, request.alias, request.password,
      new Uint8Array([1, 2, 3, 255]), request.imageFileExtension
    )).resolves.toBe(result);
    expect(operation).toHaveBeenCalledWith(request);
    expect(JSON.parse(JSON.stringify(operation.mock.calls[0][0]))).toEqual({
      firstName: "Test", lastName: "User", alias: "@test-user", password: "dummy-password",
      imageStringBase64: "AQID/w==", imageFileExtension: "png",
    });
  });

  it("propagates facade failures through the client service", async () => {
    const facade = new ServerFacade();
    jest.spyOn(facade, "register").mockRejectedValue(new Error("Register failed"));

    await expect(new UserService(facade).register(
      request.firstName, request.lastName, request.alias, request.password,
      new Uint8Array([1, 2, 3, 255]), request.imageFileExtension
    )).rejects.toThrow("Register failed");
  });
});
