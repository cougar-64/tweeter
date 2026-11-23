// AI-assisted: see AI-ATTRIBUTION.md
import { AuthToken, FakeData, User } from "tweeter-shared";
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
  // Optional only while the remaining Milestone 3 methods migrate to DAOs.
  public constructor(
    private readonly factory?: AuthenticationDAOFactory,
    private readonly authorization?: Pick<AuthorizationService, "createSession">
  ) {}

  public async logout(_token: string): Promise<void> {
    // Milestone 3 simulates logout; session invalidation comes later.
    await new Promise<void>((resolve) => setTimeout(resolve, 1000));
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
