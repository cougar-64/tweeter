// AI-assisted: see AI-ATTRIBUTION.md
import { FakeData, User } from "tweeter-shared";

export class UserService {
  public async getUser(_token: string, alias: string): Promise<User | null> {
    // Milestone 3 uses dummy users; token verification comes later.
    return FakeData.instance.findUserByAlias(alias);
  }
}
