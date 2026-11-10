// AI-assisted: see AI-ATTRIBUTION.md
import { AuthToken, FakeData, User } from "tweeter-shared";

export class UserService {
  public async logout(_token: string): Promise<void> {
    // Milestone 3 simulates logout; session invalidation comes later.
    await new Promise<void>((resolve) => setTimeout(resolve, 1000));
  }

  public async register(
    _firstName: string,
    _lastName: string,
    _alias: string,
    _password: string,
    _imageStringBase64: string,
    _imageFileExtension: string
  ): Promise<[User, AuthToken]> {
    // Preserve Milestone 3 dummy registration; user/image persistence comes later.
    const user = FakeData.instance.firstUser;
    if (user === null) {
      throw new Error("Invalid registration");
    }
    return [user, FakeData.instance.authToken];
  }

  public async login(_alias: string, _password: string): Promise<[User, AuthToken]> {
    // Preserve Milestone 3 dummy login; real credential checks come later.
    const user = FakeData.instance.firstUser;
    if (user === null) {
      throw new Error("Invalid alias or password");
    }
    return [user, FakeData.instance.authToken];
  }

  public async getUser(_token: string, alias: string): Promise<User | null> {
    // Milestone 3 uses dummy users; token verification comes later.
    return FakeData.instance.findUserByAlias(alias);
  }
}
