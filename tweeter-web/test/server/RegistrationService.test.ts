/** @jest-environment node */
/// <reference types="node" />
// AI-assisted: see AI-ATTRIBUTION.md
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { AuthToken, User } from "tweeter-shared";
import type { UserDAO } from "../../../tweeter-server/src/model/dao/UserDAO";
import type { ImageDAO } from "../../../tweeter-server/src/model/dao/ImageDAO";
import type { SessionDAO } from "../../../tweeter-server/src/model/dao/SessionDAO";
import { AuthorizationService } from "../../../tweeter-server/src/model/service/AuthorizationService";
import { UserService } from "../../../tweeter-server/src/model/service/UserService";

const image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";
const password = "test-password";
const imageUrl = "https://example.com/new-profile.png";
const duplicate = "[Bad Request] That alias is already registered.";

describe("UserService registration", () => {
  let users: jest.Mocked<UserDAO>;
  let images: jest.Mocked<ImageDAO>;
  let sessions: jest.Mocked<SessionDAO>;
  let service: UserService;

  beforeEach(() => {
    users = { getUser: jest.fn().mockResolvedValue(null), createUser: jest.fn().mockResolvedValue(true) };
    images = {
      putImage: jest.fn().mockImplementation(async (imageId: string) => ({ imageId, url: imageUrl })),
      deleteImage: jest.fn(),
    };
    sessions = { createSession: jest.fn(), refreshSession: jest.fn(), deleteSession: jest.fn() };
    const factory = { createUserDAO: () => users, createImageDAO: () => images, createSessionDAO: () => sessions };
    service = new UserService(factory, new AuthorizationService(factory, 1800));
    jest.spyOn(bcrypt, "hash").mockImplementation(async () => "test-password-hash");
  });
  afterEach(() => jest.restoreAllMocks());

  const register = (target: UserService, credential = password, encodedImage = image, extension = "png") =>
    target.register("Test", "User", "@test", credential, encodedImage, extension);

  it("persists a salted bcrypt hash, uploads decoded image bytes, and automatically creates a real session", async () => {
    jest.spyOn(bcrypt, "hash").mockRestore();
    const [user, token] = await register(service);
    expect(user).toBeInstanceOf(User);
    expect(user.dto).toEqual({ firstName: "Test", lastName: "User", alias: "@test", imageUrl });
    const storedHash = users.createUser.mock.calls[0][1];
    expect(bcrypt.getRounds(storedHash)).toBe(12);
    expect(await bcrypt.compare(password, storedHash)).toBe(true);
    expect(await bcrypt.compare("wrong-password", storedHash)).toBe(false);
    expect(storedHash).not.toBe(password);
    expect(user.dto).not.toHaveProperty("passwordHash");
    expect(images.putImage).toHaveBeenCalledWith(expect.stringMatching(/^[a-f0-9-]{36}\.png$/), Buffer.from(image, "base64"), "image/png");
    expect(token).toBeInstanceOf(AuthToken);
    expect(sessions.createSession).toHaveBeenCalledWith({
      tokenHash: createHash("sha256").update(token.token).digest("hex"), userAlias: "@test",
      lastActivity: Math.floor(token.timestamp / 1000), expiresAt: Math.floor(token.timestamp / 1000) + 1800,
    });
    expect(users.createUser.mock.invocationCallOrder[0]).toBeLessThan(sessions.createSession.mock.invocationCallOrder[0]);
    expect(images.deleteImage).not.toHaveBeenCalled();
  });

  it("generates unique image IDs for separate registration attempts", async () => {
    await register(service);
    await register(service);
    expect(images.putImage.mock.calls[0][0]).not.toBe(images.putImage.mock.calls[1][0]);
  });

  it("rejects an existing alias before hashing, uploading, or issuing a token", async () => {
    users.getUser.mockResolvedValue({
      profile: new User("Existing", "User", "@test", "https://example.com/old.png").dto,
      passwordHash: "old-hash", followerCount: 0, followeeCount: 0,
    });
    await expect(register(service)).rejects.toThrow(duplicate);
    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(images.putImage).not.toHaveBeenCalled();
    expect(users.createUser).not.toHaveBeenCalled();
    expect(sessions.createSession).not.toHaveBeenCalled();
  });

  it("cleans up only this attempt's image when a concurrent registration claims the alias", async () => {
    users.createUser.mockResolvedValue(false);
    await expect(register(service)).rejects.toThrow(duplicate);
    expect(images.deleteImage).toHaveBeenCalledWith(images.putImage.mock.calls[0][0]);
    expect(sessions.createSession).not.toHaveBeenCalled();
  });

  it("reports cleanup failure as an infrastructure error with both causes", async () => {
    const cleanup = new Error("S3 deletion failed");
    users.createUser.mockResolvedValue(false);
    images.deleteImage.mockRejectedValue(cleanup);
    try {
      await register(service);
      throw new Error("Expected registration failure");
    } catch (error) {
      expect(error).toBeInstanceOf(AggregateError);
      const aggregate = error as AggregateError;
      expect(aggregate.message).toBe("Registration failed and image cleanup failed.");
      expect(aggregate.errors[0].message).toBe(duplicate);
      expect(aggregate.errors[1]).toBe(cleanup);
    }
  });

  it.each(["", " ", "a".repeat(73), "😀".repeat(19)])("rejects an invalid or overlong password before storage", async (credential) => {
    await expect(register(service, credential)).rejects.toThrow("[Bad Request] Password");
    expect(users.getUser).not.toHaveBeenCalled();
    expect(images.putImage).not.toHaveBeenCalled();
  });

  it("accepts exactly 72 UTF-8 bytes without trimming the supplied password", async () => {
    const credential = " " + "a".repeat(70) + " ";
    await register(service, credential);
    expect(bcrypt.hash).toHaveBeenCalledWith(credential, 12);
  });

  it.each(["", "not-base64!", "AQ", "data:image/png;base64,AQID"]) ("rejects malformed image encoding %j", async (encodedImage) => {
    await expect(register(service, password, encodedImage)).rejects.toThrow("[Bad Request] The image must be valid Base64.");
    expect(images.putImage).not.toHaveBeenCalled();
    expect(users.createUser).not.toHaveBeenCalled();
  });

  it.each([[".JPEG", "jpeg", "image/jpeg"], ["gif", "gif", "image/gif"], ["webp", "webp", "image/webp"], ["bmp", "bmp", "image/bmp"]])(
    "maps extension %s to the correct content type", async (extension, suffix, contentType) => {
      await register(service, password, image, extension);
      expect(images.putImage).toHaveBeenCalledWith(expect.stringMatching(new RegExp(`\\.${suffix}$`)), expect.any(Uint8Array), contentType);
    }
  );

  it.each(["svg", "html", "../png", "constructor"])("rejects unsupported image extension %j", async (extension) => {
    await expect(register(service, password, image, extension)).rejects.toThrow("[Bad Request] Supported image extensions");
    expect(images.putImage).not.toHaveBeenCalled();
  });

  it.each(["lookup", "hash", "upload", "user-write", "session-write"])("propagates %s failure and preserves images after uncertain or committed user writes", async (operation) => {
    const error = new Error(`${operation} failed`);
    if (operation === "lookup") users.getUser.mockRejectedValue(error);
    if (operation === "hash") jest.spyOn(bcrypt, "hash").mockImplementation(async () => { throw error; });
    if (operation === "upload") images.putImage.mockRejectedValue(error);
    if (operation === "user-write") users.createUser.mockRejectedValue(error);
    if (operation === "session-write") sessions.createSession.mockRejectedValue(error);
    await expect(register(service)).rejects.toBe(error);
    expect(images.deleteImage).not.toHaveBeenCalled();
    if (operation !== "session-write") expect(sessions.createSession).not.toHaveBeenCalled();
  });

  it("requires injected dependencies for registration instead of falling back to FakeData", async () => {
    await expect(register(new UserService())).rejects.toThrow("Registration dependencies are required.");
  });
});
