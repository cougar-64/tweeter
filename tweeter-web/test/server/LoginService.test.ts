/** @jest-environment node */
/// <reference types="node" />
// AI-assisted: see AI-ATTRIBUTION.md
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { AuthToken, User } from "tweeter-shared";
import type { UserDAO } from "../../../tweeter-server/src/model/dao/UserDAO";
import type { SessionDAO } from "../../../tweeter-server/src/model/dao/SessionDAO";
import type { UserRecord } from "../../../tweeter-server/src/model/dao/DAOModels";
import { AuthorizationService } from "../../../tweeter-server/src/model/service/AuthorizationService";
import { UserService } from "../../../tweeter-server/src/model/service/UserService";

const profile = { firstName: "Amy", lastName: "Ames", alias: "@amy", imageUrl: "https://example.com/amy.png" };
const password = " a password with spaces ";
const invalidCredentials = "[Unauthorized] Invalid alias or password.";

describe("UserService login", () => {
  let record: UserRecord;
  let users: jest.Mocked<UserDAO>;
  let sessions: jest.Mocked<SessionDAO>;
  let imageFactory: jest.Mock;
  let service: UserService;
  let storedHash: string;

  beforeAll(async () => { storedHash = await bcrypt.hash(password, 12); });
  beforeEach(() => {
    record = { profile, passwordHash: storedHash, followerCount: 7, followeeCount: 9 };
    users = { getUser: jest.fn().mockResolvedValue(record), createUser: jest.fn() };
    sessions = { createSession: jest.fn(), refreshSession: jest.fn(), deleteSession: jest.fn() };
    imageFactory = jest.fn();
    const factory = { createUserDAO: () => users, createSessionDAO: () => sessions, createImageDAO: imageFactory };
    service = new UserService(factory, new AuthorizationService(factory, 1800));
    jest.spyOn(bcrypt, "compare").mockImplementation(async () => true);
  });
  afterEach(() => jest.restoreAllMocks());

  it("verifies the real bcrypt hash, reconstructs the stored profile, and persists a fresh session", async () => {
    jest.spyOn(bcrypt, "compare").mockRestore();
    const [user, token] = await service.login("@amy", password);
    expect(users.getUser).toHaveBeenCalledWith("@amy");
    expect(user).toBeInstanceOf(User);
    expect(user.dto).toEqual(profile);
    expect(user.dto).not.toHaveProperty("passwordHash");
    expect(user.dto).not.toHaveProperty("followerCount");
    expect(token).toBeInstanceOf(AuthToken);
    expect(token.token).toMatch(/^[a-f0-9]{64}$/);
    expect(sessions.createSession).toHaveBeenCalledWith({
      tokenHash: createHash("sha256").update(token.token).digest("hex"), userAlias: "@amy",
      lastActivity: Math.floor(token.timestamp / 1000), expiresAt: Math.floor(token.timestamp / 1000) + 1800,
    });
    expect(users.createUser).not.toHaveBeenCalled();
    expect(imageFactory).not.toHaveBeenCalled();
  });

  it("preserves the alias and password exactly during lookup and comparison", async () => {
    await service.login("@amy", password);
    expect(users.getUser).toHaveBeenCalledWith("@amy");
    expect(bcrypt.compare).toHaveBeenCalledWith(password, storedHash);
  });

  it("rejects an unknown alias with the same generic error and creates no session", async () => {
    users.getUser.mockResolvedValue(null);
    await expect(service.login("@missing", password)).rejects.toThrow(invalidCredentials);
    expect(bcrypt.compare).not.toHaveBeenCalled();
    expect(sessions.createSession).not.toHaveBeenCalled();
  });

  it("rejects an incorrect password against the real hash without issuing a session", async () => {
    jest.spyOn(bcrypt, "compare").mockRestore();
    await expect(service.login("@amy", "incorrect-password")).rejects.toThrow(invalidCredentials);
    expect(sessions.createSession).not.toHaveBeenCalled();
  });

  it.each(["", " ", "a".repeat(73), "😀".repeat(19)])("rejects invalid/overlong password %j before accessing storage", async (credential) => {
    await expect(service.login("@amy", credential)).rejects.toThrow(invalidCredentials);
    expect(users.getUser).not.toHaveBeenCalled();
    expect(bcrypt.compare).not.toHaveBeenCalled();
    expect(sessions.createSession).not.toHaveBeenCalled();
  });

  it("rejects a blank alias before storage access", async () => {
    await expect(service.login(" ", password)).rejects.toThrow(invalidCredentials);
    expect(users.getUser).not.toHaveBeenCalled();
    expect(sessions.createSession).not.toHaveBeenCalled();
  });

  it("permits a 72-byte password to reach comparison without truncation", async () => {
    const credential = "😀".repeat(18);
    await service.login("@amy", credential);
    expect(bcrypt.compare).toHaveBeenCalledWith(credential, storedHash);
  });

  it("issues a distinct token for each successful login", async () => {
    const [, first] = await service.login("@amy", password);
    const [, second] = await service.login("@amy", password);
    expect(first.token).not.toBe(second.token);
    expect(sessions.createSession).toHaveBeenCalledTimes(2);
  });

  it("does not persist a session until credential comparison succeeds", async () => {
    let finishComparison!: (matches: boolean) => void;
    const pending = new Promise<boolean>((resolve) => { finishComparison = resolve; });
    jest.spyOn(bcrypt, "compare").mockImplementation(() => pending);
    const login = service.login("@amy", password);
    await Promise.resolve();
    expect(sessions.createSession).not.toHaveBeenCalled();
    finishComparison(true);
    await login;
    expect(sessions.createSession).toHaveBeenCalledTimes(1);
  });

  it.each(["lookup", "comparison", "session"])("propagates %s failure as an infrastructure error", async (operation) => {
    const error = new Error("Infrastructure unavailable");
    if (operation === "lookup") users.getUser.mockRejectedValue(error);
    if (operation === "comparison") jest.spyOn(bcrypt, "compare").mockImplementation(async () => { throw error; });
    if (operation === "session") sessions.createSession.mockRejectedValue(error);
    await expect(service.login("@amy", password)).rejects.toBe(error);
    if (operation !== "session") expect(sessions.createSession).not.toHaveBeenCalled();
  });

  it("requires injected login dependencies instead of falling back to FakeData", async () => {
    await expect(new UserService().login("@amy", password)).rejects.toThrow("Login dependencies are required.");
  });
});
