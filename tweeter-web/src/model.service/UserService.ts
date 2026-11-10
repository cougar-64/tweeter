// AI-assisted: see AI-ATTRIBUTION.md
import {AuthToken, LoginRequest, RegisterRequest, User, UserAliasRequest} from "tweeter-shared";
import { Buffer } from "buffer";
import {Service} from "./Service";
import {ServerFacade} from "../net/ServerFacade";

// for displayed user, logout, sign in/register, etc.
export class UserService implements Service {
    public constructor(private readonly serverFacade: ServerFacade = new ServerFacade()) {}

    public async getUser (
        authToken: AuthToken,
        alias: string
    ): Promise<User | null> {
        return this.serverFacade.getUser(new UserAliasRequest(authToken.token, alias));
    };

    public login = async (
      alias: string,
      password: string
    ): Promise<[User, AuthToken]> => {
      return this.serverFacade.login(new LoginRequest(alias, password));
    };

    public register = async (
      firstName: string,
      lastName: string,
      alias: string,
      password: string,
      userImageBytes: Uint8Array,
      imageFileExtension: string
    ): Promise<[User, AuthToken]> => {
      const imageStringBase64: string =
        Buffer.from(userImageBytes).toString("base64");
      return this.serverFacade.register(new RegisterRequest(
        firstName, lastName, alias, password, imageStringBase64, imageFileExtension
      ));
    };

    public logout(authToken: AuthToken): Promise<void> {
        return new Promise((res) => setTimeout(res, 1000));
    }
}
