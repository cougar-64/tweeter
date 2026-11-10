// AI-assisted: see AI-ATTRIBUTION.md
import { AuthenticationResponse, AuthToken, LoginRequest, User } from "tweeter-shared";
import { UserService } from "../../src/model.service/UserService";
import { ClientCommunicator } from "../../src/net/ClientCommunicator";
import { ServerFacade } from "../../src/net/ServerFacade";

const request = new LoginRequest("@allen", "dummy-password");
const userDto = { firstName: "Allen", lastName: "Anderson", alias: "@allen", imageUrl: "https://example.com/allen.png" };
const tokenDto = { token: "dummy-token", timestamp: 123456789 };

describe("Login client networking", () => {
  afterEach(() => jest.restoreAllMocks());

  it("reconstructs both domain objects and preserves the existing token storage format", async () => {
    const operation = jest.spyOn(ClientCommunicator.prototype, "doPost")
      .mockResolvedValue(new AuthenticationResponse(true, null, userDto, tokenDto));

    const [user, token] = await new ServerFacade().login(request);

    expect(operation).toHaveBeenCalledWith(request, "/user/login");
    expect(user).toBeInstanceOf(User);
    expect(user.name).toBe("Allen Anderson");
    expect(user.dto).toEqual(userDto);
    expect(token).toBeInstanceOf(AuthToken);
    expect(token.dto).toEqual(tokenDto);
    expect(JSON.parse(token.toJson())).toEqual({ _token: tokenDto.token, _timestamp: tokenDto.timestamp });
    expect(AuthToken.fromJson(token.toJson())!.dto).toEqual(tokenDto);
  });

  it("serializes login without requiring an existing authentication token", () => {
    expect(JSON.parse(JSON.stringify(request))).toEqual({ alias: "@allen", password: "dummy-password" });
  });

  it.each([undefined, null, {}, { ...userDto, alias: 123 }])("rejects a malformed user of %p", async (user) => {
    const response = { success: true, message: null, user, authToken: tokenDto };
    jest.spyOn(ClientCommunicator.prototype, "doPost").mockResolvedValue(response);

    await expect(new ServerFacade().login(request)).rejects.toThrow("Invalid login response.");
  });

  it.each([
    undefined, null, {}, { ...tokenDto, token: " " }, { ...tokenDto, token: 123 },
    { ...tokenDto, timestamp: "123" }, { ...tokenDto, timestamp: NaN }, { ...tokenDto, timestamp: -1 },
  ])("rejects a malformed authentication token of %p", async (authToken) => {
    const response = { success: true, message: null, user: userDto, authToken };
    jest.spyOn(ClientCommunicator.prototype, "doPost").mockResolvedValue(response);

    await expect(new ServerFacade().login(request)).rejects.toThrow("Invalid login response.");
  });

  it.each([["Login unavailable", "Login unavailable"], [null, "Failed to login."]] as const)(
    "rejects an unsuccessful operation with message %p", async (message, expected) => {
      const response = { success: false, message };
      jest.spyOn(ClientCommunicator.prototype, "doPost").mockResolvedValue(response);

      await expect(new ServerFacade().login(request)).rejects.toThrow(expected);
    }
  );

  it("propagates HTTP or transport failures", async () => {
    jest.spyOn(ClientCommunicator.prototype, "doPost").mockRejectedValue(new Error("HTTP failure"));

    await expect(new ServerFacade().login(request)).rejects.toThrow("HTTP failure");
  });

  it("passes credentials through the client service and returns the facade result", async () => {
    const facade = new ServerFacade();
    const result: [User, AuthToken] = [User.fromDto(userDto), AuthToken.fromDto(tokenDto)];
    const operation = jest.spyOn(facade, "login").mockResolvedValue(result);

    await expect(new UserService(facade).login(request.alias, request.password)).resolves.toBe(result);
    expect(operation).toHaveBeenCalledWith(request);
  });
});
