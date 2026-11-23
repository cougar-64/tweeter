// AI-assisted: see AI-ATTRIBUTION.md
import { AuthToken, User } from "tweeter-shared";
import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import type { AuthenticationDAOFactory } from "../dao/AuthenticationDAOFactory";
import type { AuthorizationService } from "./AuthorizationService";

const imageContentTypes = new Map([
  ["png", "image/png"], ["jpg", "image/jpeg"], ["jpeg", "image/jpeg"],
  ["gif", "image/gif"], ["webp", "image/webp"], ["bmp", "image/bmp"],
]);

export class UserService {
  // Production composition supplies both dependencies; guards reject unconfigured use.
  public constructor(
    private readonly factory?: AuthenticationDAOFactory,
    private readonly authorization?: Pick<AuthorizationService, "createSession" | "revokeSession" | "authorize">
  ) {}

  public async logout(token: string): Promise<void> {
    if (!this.authorization) {
      throw new Error("Logout dependencies are required.");
    }
    await this.authorization.revokeSession(token);
  }

  public async register(
    firstName: string,
    lastName: string,
    alias: string,
    password: string,
    imageStringBase64: string,
    imageFileExtension: string
  ): Promise<[User, AuthToken]> {
    if (!this.factory || !this.authorization) {
      throw new Error("Registration dependencies are required.");
    }
    // bcrypt handles only 72 UTF-8 bytes. Reject longer input rather than
    // silently treating different passwords as the same credential.
    if (password.trim().length === 0 || bcrypt.truncates(password)) {
      throw new Error("[Bad Request] Password must contain between 1 and 72 UTF-8 bytes.");
    }
    const extension = imageFileExtension.replace(/^\./, "").toLowerCase();
    const contentType = imageContentTypes.get(extension);
    if (!contentType) {
      throw new Error("[Bad Request] Supported image extensions are png, jpg, jpeg, gif, webp, and bmp.");
    }
    const imageBytes = Buffer.from(imageStringBase64, "base64");
    if (imageBytes.length === 0 || imageBytes.toString("base64") !== imageStringBase64) {
      throw new Error("[Bad Request] The image must be valid Base64.");
    }
    const users = this.factory.createUserDAO();
    const images = this.factory.createImageDAO();
    const duplicate = () => new Error("[Bad Request] That alias is already registered.");
    // This avoids unnecessary work; the conditional create handles races.
    if (await users.getUser(alias) !== null) {
      throw duplicate();
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const image = await images.putImage(`${randomUUID()}.${extension}`, imageBytes, contentType);
    const user = new User(firstName, lastName, alias, image.url);
    // If this write throws, its outcome may be unknown. Keep the image because
    // a committed user may already reference it; never delete it speculatively.
    const created = await users.createUser(user.dto, passwordHash);
    if (!created) {
      const error = duplicate();
      try {
        await images.deleteImage(image.imageId);
      } catch (cleanupError) {
        throw new AggregateError([error, cleanupError], "Registration failed and image cleanup failed.");
      }
      throw error;
    }
    // Keep the committed account/image if session creation fails. Login can
    // recover access once the session store is available again.
    const token = await this.authorization.createSession(alias);
    return [user, token];
  }

  public async login(alias: string, password: string): Promise<[User, AuthToken]> {
    if (!this.factory || !this.authorization) {
      throw new Error("Login dependencies are required.");
    }
    const invalidCredentials = () => new Error("[Unauthorized] Invalid alias or password.");
    // Apply the same byte limit as registration; never accept a truncated
    // password sharing the first 72 bytes with the actual credential.
    if (alias.trim().length === 0 || password.trim().length === 0 || bcrypt.truncates(password)) {
      throw invalidCredentials();
    }
    const record = await this.factory.createUserDAO().getUser(alias);
    if (record === null || !await bcrypt.compare(password, record.passwordHash)) {
      throw invalidCredentials();
    }
    const token = await this.authorization.createSession(record.profile.alias);
    return [User.fromDto(record.profile), token];
  }

  public async getUser(token: string, alias: string): Promise<User | null> {
    if (!this.factory || !this.authorization) {
      throw new Error("User lookup dependencies are required.");
    }
    await this.authorization.authorize(token);
    const record = await this.factory.createUserDAO().getUser(alias);
    return record === null ? null : User.fromDto(record.profile);
  }
}
