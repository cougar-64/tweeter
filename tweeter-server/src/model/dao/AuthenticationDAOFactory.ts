// AI-assisted: see AI-ATTRIBUTION.md
import type { ImageDAO } from "./ImageDAO";
import type { SessionDAO } from "./SessionDAO";
import type { UserDAO } from "./UserDAO";

/** Authentication services need only this subset of the complete factory. */
export interface AuthenticationDAOFactory {
  createUserDAO(): UserDAO;
  createSessionDAO(): SessionDAO;
  createImageDAO(): ImageDAO;
}
