// AI-assisted: see AI-ATTRIBUTION.md
import type { UserDto } from "tweeter-shared";
import type { UserRecord } from "./DAOModels";

export interface UserDAO {
  /** Atomically reserve the alias; false means it already exists. */
  createUser(profile: UserDto, passwordHash: string): Promise<boolean>;
  getUser(alias: string): Promise<UserRecord | null>;
}
