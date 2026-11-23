/** @jest-environment node */
/// <reference types="node" />
// AI-assisted: see AI-ATTRIBUTION.md
import { createHash } from "node:crypto";
import { User } from "tweeter-shared";
import type { UserDAO } from "../../../tweeter-server/src/model/dao/UserDAO";
import type { SessionDAO } from "../../../tweeter-server/src/model/dao/SessionDAO";
import type { SessionRecord } from "../../../tweeter-server/src/model/dao/DAOModels";
import { AuthorizationService } from "../../../tweeter-server/src/model/service/AuthorizationService";
import { UserService } from "../../../tweeter-server/src/model/service/UserService";

const token = "ab".repeat(32);
const tokenHash = createHash("sha256").update(token).digest("hex");
const now = 1700000000;
const profile = { firstName: "Bob", lastName: "Brown", alias: "@bob", imageUrl: "https://example.com/bob.png" };
const unauthorized = "[Unauthorized] Invalid or expired authentication token.";

describe("UserService authenticated user lookup", () => {
  let users: jest.Mocked<UserDAO>;
  let sessions: jest.Mocked<SessionDAO>;
  let records: Map<string, SessionRecord>;
  let service: UserService;

  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(now * 1000);
    records = new Map([[tokenHash, { tokenHash, userAlias: "@amy", lastActivity: now - 60, expiresAt: now + 1740 }]]);
    users = {
      getUser: jest.fn().mockResolvedValue({ profile, passwordHash: "private-hash", followerCount: 7, followeeCount: 8 }),
      createUser: jest.fn(),
    };
    sessions = {
      createSession: jest.fn(),
      refreshSession: jest.fn().mockImplementation(async (hash: string, activity: number, interval: number) => {
        const record = records.get(hash);
        if (!record || record.expiresAt <= activity) return null;
        const updated = { ...record, lastActivity: activity, expiresAt: activity + interval };
        records.set(hash, updated);
        return updated;
      }),
      deleteSession: jest.fn().mockImplementation(async (hash: string) => { records.delete(hash); }),
    };
    const factory = { createUserDAO: () => users, createSessionDAO: () => sessions, createImageDAO: jest.fn() };
    service = new UserService(factory, new AuthorizationService(factory, 1800));
  });
  afterEach(() => jest.restoreAllMocks());

  it("authorizes before lookup and returns another user's public profile without credential/storage fields", async () => {
    const user = await service.getUser(token, "@bob");
    expect(user).toBeInstanceOf(User);
    expect(user!.dto).toEqual(profile);
    expect(user).not.toHaveProperty("passwordHash");
    expect(user!.dto).not.toHaveProperty("followerCount");
    expect(users.getUser).toHaveBeenCalledWith("@bob");
    expect(sessions.refreshSession).toHaveBeenCalledWith(tokenHash, now, 1800);
    expect(sessions.refreshSession.mock.invocationCallOrder[0]).toBeLessThan(users.getUser.mock.invocationCallOrder[0]);
    expect(users.createUser).not.toHaveBeenCalled();
  });

  it("returns null for an unknown profile after authenticating the session", async () => {
    users.getUser.mockResolvedValue(null);
    await expect(service.getUser(token, "@missing")).resolves.toBeNull();
    expect(sessions.refreshSession).toHaveBeenCalledTimes(1);
    expect(users.getUser).toHaveBeenCalledWith("@missing");
  });

  it("refreshes inactivity and remains valid beyond the previous expiration", async () => {
    await service.getUser(token, "@bob");
    expect(records.get(tokenHash)!.expiresAt).toBe(now + 1800);
    jest.spyOn(Date, "now").mockReturnValue((now + 1750) * 1000);
    await expect(service.getUser(token, "@bob")).resolves.toBeInstanceOf(User);
    expect(records.get(tokenHash)!.expiresAt).toBe(now + 3550);
  });

  it.each([0, -1])("rejects an expired session still awaiting TTL cleanup (offset %i)", async (offset) => {
    records.set(tokenHash, { ...records.get(tokenHash)!, expiresAt: now + offset });
    await expect(service.getUser(token, "@bob")).rejects.toThrow(unauthorized);
    expect(users.getUser).not.toHaveBeenCalled();
  });

  it("rejects an unknown token without looking up the requested profile", async () => {
    await expect(service.getUser("cd".repeat(32), "@bob")).rejects.toThrow(unauthorized);
    expect(users.getUser).not.toHaveBeenCalled();
  });

  it("rejects profile lookup after logout revokes that session", async () => {
    await service.logout(token);
    await expect(service.getUser(token, "@bob")).rejects.toThrow(unauthorized);
    expect(users.getUser).not.toHaveBeenCalled();
  });

  it.each(["", " ", "dummy-token"])("rejects malformed token %j before profile access", async (invalid) => {
    await expect(service.getUser(invalid, "@bob")).rejects.toThrow(unauthorized);
    expect(sessions.refreshSession).not.toHaveBeenCalled();
    expect(users.getUser).not.toHaveBeenCalled();
  });

  it("does not read a profile until authorization completes", async () => {
    let complete!: (value: SessionRecord) => void;
    sessions.refreshSession.mockReturnValue(new Promise((resolve) => { complete = resolve; }));
    const lookup = service.getUser(token, "@bob");
    expect(users.getUser).not.toHaveBeenCalled();
    complete(records.get(tokenHash)!);
    await expect(lookup).resolves.toBeInstanceOf(User);
  });

  it("propagates session-store failure and does not query users", async () => {
    const error = new Error("Session store unavailable");
    sessions.refreshSession.mockRejectedValue(error);
    await expect(service.getUser(token, "@bob")).rejects.toBe(error);
    expect(users.getUser).not.toHaveBeenCalled();
  });

  it("propagates user-store failure rather than returning null", async () => {
    const error = new Error("User store unavailable");
    users.getUser.mockRejectedValue(error);
    await expect(service.getUser(token, "@bob")).rejects.toBe(error);
  });

  it("requires injected dependencies rather than falling back to FakeData", async () => {
    await expect(new UserService().getUser(token, "@bob")).rejects.toThrow("User lookup dependencies are required.");
  });
});
