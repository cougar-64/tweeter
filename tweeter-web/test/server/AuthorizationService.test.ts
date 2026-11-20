/** @jest-environment node */
/// <reference types="node" />
// AI-assisted: see AI-ATTRIBUTION.md
import { createHash } from "node:crypto";
import crypto from "node:crypto";
import { AuthToken } from "tweeter-shared";
import type { SessionRecord } from "../../../tweeter-server/src/model/dao/DAOModels";
import type { SessionDAO } from "../../../tweeter-server/src/model/dao/SessionDAO";
import { AuthorizationService } from "../../../tweeter-server/src/model/service/AuthorizationService";

const timestamp = 1700000000123;
const now = Math.floor(timestamp / 1000);
const token = "ab".repeat(32);
const tokenHash = createHash("sha256").update(token).digest("hex");
const record: SessionRecord = { tokenHash, userAlias: "@amy", lastActivity: now, expiresAt: now + 1800 };
const unauthorized = "[Unauthorized] Invalid or expired authentication token.";

describe("AuthorizationService", () => {
  let dao: jest.Mocked<SessionDAO>;
  let factory: { createSessionDAO: jest.Mock<SessionDAO, []> };
  let service: AuthorizationService;

  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(timestamp);
    dao = { createSession: jest.fn(), refreshSession: jest.fn(), deleteSession: jest.fn() };
    factory = { createSessionDAO: jest.fn(() => dao) };
    service = new AuthorizationService(factory, 1800);
  });
  afterEach(() => jest.restoreAllMocks());

  it("issues a 256-bit token and stores only its digest with a 30-minute expiration", async () => {
    const issued = await service.createSession("@amy");
    expect(issued).toBeInstanceOf(AuthToken);
    expect(issued.token).toMatch(/^[a-f0-9]{64}$/);
    expect(issued.timestamp).toBe(timestamp);
    expect(dao.createSession).toHaveBeenCalledWith({
      tokenHash: createHash("sha256").update(issued.token).digest("hex"),
      userAlias: "@amy", lastActivity: now, expiresAt: now + 1800,
    });
    expect(dao.createSession.mock.calls[0][0]).not.toHaveProperty("token");
    expect(dao.createSession.mock.calls[0][0].tokenHash).not.toBe(issued.token);
  });

  it("issues separate tokens for simultaneous sessions belonging to the same user", async () => {
    const first = await service.createSession("@amy");
    const second = await service.createSession("@amy");
    expect(first.token).not.toBe(second.token);
    expect(dao.createSession).toHaveBeenCalledTimes(2);
  });

  it("fails without storing a session if secure token generation fails", async () => {
    const error = new Error("Secure randomness unavailable");
    jest.spyOn(crypto, "randomBytes").mockImplementation(() => { throw error; });
    await expect(service.createSession("@amy")).rejects.toBe(error);
    expect(dao.createSession).not.toHaveBeenCalled();
  });

  it("uses the interval passed by the composition layer", async () => {
    const shortSessionService = new AuthorizationService(factory, 60);
    await shortSessionService.createSession("@amy");
    expect(dao.createSession).toHaveBeenCalledWith(expect.objectContaining({ expiresAt: now + 60 }));
    dao.refreshSession.mockResolvedValue(record);
    await shortSessionService.authorize(token);
    expect(dao.refreshSession).toHaveBeenCalledWith(tokenHash, now, 60);
  });

  it("authorizes the session owner and delegates atomic refresh using server time", async () => {
    dao.refreshSession.mockResolvedValue(record);
    await expect(service.authorize(token)).resolves.toBe("@amy");
    expect(dao.refreshSession).toHaveBeenCalledWith(tokenHash, now, 1800);
    expect(factory.createSessionDAO).toHaveBeenCalledTimes(1);
  });

  it.each([null, { ...record, expiresAt: now }, { ...record, expiresAt: now - 1 }])(
    "rejects missing/revoked/expired sessions", async (session) => {
      dao.refreshSession.mockResolvedValue(session);
      await expect(service.authorize(token)).rejects.toThrow(unauthorized);
    }
  );

  it.each(["", " ", "milestone-3-test-token", "ab".repeat(31), "AB".repeat(32), "gg".repeat(32), ` ${token}`])(
    "rejects malformed token %j before accessing storage", async (invalid) => {
      await expect(service.authorize(invalid)).rejects.toThrow(unauthorized);
      expect(dao.refreshSession).not.toHaveBeenCalled();
    }
  );

  it("authenticates logout, then deletes only the matching token digest", async () => {
    dao.refreshSession.mockResolvedValue(record);
    await service.revokeSession(token);
    expect(dao.refreshSession).toHaveBeenCalledWith(tokenHash, now, 1800);
    expect(dao.deleteSession).toHaveBeenCalledWith(tokenHash);
    expect(dao.refreshSession.mock.invocationCallOrder[0]).toBeLessThan(dao.deleteSession.mock.invocationCallOrder[0]);
  });

  it("does not delete a session when logout authentication fails", async () => {
    dao.refreshSession.mockResolvedValue(null);
    await expect(service.revokeSession(token)).rejects.toThrow(unauthorized);
    expect(dao.deleteSession).not.toHaveBeenCalled();
  });

  it.each(["create", "refresh", "delete"])("propagates storage failure during %s", async (operation) => {
    const error = new Error("Database unavailable");
    dao.refreshSession.mockResolvedValue(record);
    if (operation === "create") dao.createSession.mockRejectedValue(error);
    if (operation === "refresh") dao.refreshSession.mockRejectedValue(error);
    if (operation === "delete") dao.deleteSession.mockRejectedValue(error);
    const promise = operation === "create" ? service.createSession("@amy")
      : operation === "refresh" ? service.authorize(token) : service.revokeSession(token);
    await expect(promise).rejects.toBe(error);
  });

  it("does not delete if the refresh fails during logout", async () => {
    dao.refreshSession.mockRejectedValue(new Error("Database unavailable"));
    await expect(service.revokeSession(token)).rejects.toThrow("Database unavailable");
    expect(dao.deleteSession).not.toHaveBeenCalled();
  });

  it.each([0, -1, 0.5, Infinity, NaN])("rejects invalid inactivity interval %s", (seconds) => {
    expect(() => new AuthorizationService(factory, seconds)).toThrow("Session inactivity must be a positive whole number of seconds.");
  });

  it("rejects blank owners without writing a session", async () => {
    await expect(service.createSession(" ")).rejects.toThrow("A user alias is required to create a session.");
    expect(dao.createSession).not.toHaveBeenCalled();
  });

  it("extends an active session, expires it after inactivity, and revokes a separate session", async () => {
    // Stateful database-agnostic double checks the service lifecycle across calls.
    const sessions = new Map<string, SessionRecord>();
    dao.createSession.mockImplementation(async (session) => { sessions.set(session.tokenHash, session); });
    dao.refreshSession.mockImplementation(async (hash, activity, interval) => {
      const current = sessions.get(hash);
      if (!current || current.expiresAt <= activity) return null;
      const updated = { ...current, lastActivity: activity, expiresAt: activity + interval };
      sessions.set(hash, updated);
      return updated;
    });
    dao.deleteSession.mockImplementation(async (hash) => { sessions.delete(hash); });

    const first = await service.createSession("@amy");
    jest.spyOn(Date, "now").mockReturnValue(timestamp + 1700 * 1000);
    await expect(service.authorize(first.token)).resolves.toBe("@amy");
    jest.spyOn(Date, "now").mockReturnValue(timestamp + 1900 * 1000);
    await expect(service.authorize(first.token)).resolves.toBe("@amy");
    jest.spyOn(Date, "now").mockReturnValue(timestamp + 3700 * 1000);
    await expect(service.authorize(first.token)).rejects.toThrow(unauthorized);
    expect(sessions.size).toBe(1); // Expired TTL item is deliberately still present.

    const second = await service.createSession("@bob");
    await service.revokeSession(second.token);
    await expect(service.authorize(second.token)).rejects.toThrow(unauthorized);
  });
});
