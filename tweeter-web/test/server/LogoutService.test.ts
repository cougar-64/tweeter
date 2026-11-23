/** @jest-environment node */
/// <reference types="node" />
// AI-assisted: see AI-ATTRIBUTION.md
import { createHash } from "node:crypto";
import type { SessionRecord } from "../../../tweeter-server/src/model/dao/DAOModels";
import type { SessionDAO } from "../../../tweeter-server/src/model/dao/SessionDAO";
import { AuthorizationService } from "../../../tweeter-server/src/model/service/AuthorizationService";
import { UserService } from "../../../tweeter-server/src/model/service/UserService";

const token = "ab".repeat(32);
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const now = 1700000000;
const unauthorized = "[Unauthorized] Invalid or expired authentication token.";

describe("UserService logout", () => {
  let records: Map<string, SessionRecord>;
  let dao: jest.Mocked<SessionDAO>;
  let authorization: AuthorizationService;
  let service: UserService;

  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(now * 1000);
    records = new Map([[digest(token), {
      tokenHash: digest(token), userAlias: "@amy", lastActivity: now - 60, expiresAt: now + 1740,
    }]]);
    dao = {
      createSession: jest.fn().mockImplementation(async (session: SessionRecord) => {
        records.set(session.tokenHash, session);
      }),
      refreshSession: jest.fn().mockImplementation(async (hash: string, activity: number, interval: number) => {
        const record = records.get(hash);
        if (!record || record.expiresAt <= activity) return null;
        const updated = { ...record, lastActivity: activity, expiresAt: activity + interval };
        records.set(hash, updated);
        return updated;
      }),
      deleteSession: jest.fn().mockImplementation(async (hash: string) => { records.delete(hash); }),
    };
    authorization = new AuthorizationService({ createSessionDAO: () => dao }, 1800);
    service = new UserService(undefined, authorization);
  });
  afterEach(() => jest.restoreAllMocks());

  it("authenticates and deletes the digest so subsequent authorization fails", async () => {
    await service.logout(token);
    expect(dao.refreshSession).toHaveBeenCalledWith(digest(token), now, 1800);
    expect(dao.deleteSession).toHaveBeenCalledWith(digest(token));
    expect(records.has(digest(token))).toBe(false);
    await expect(authorization.authorize(token)).rejects.toThrow(unauthorized);
  });

  it("revokes only this session and leaves another login for the same user active", async () => {
    const second = await authorization.createSession("@amy");
    await service.logout(token);
    await expect(authorization.authorize(second.token)).resolves.toBe("@amy");
    expect(records.size).toBe(1);
  });

  it("leaves a different user's session active", async () => {
    const second = await authorization.createSession("@bob");
    await service.logout(token);
    await expect(authorization.authorize(second.token)).resolves.toBe("@bob");
  });

  it("rejects repeated logout because the token has already been revoked", async () => {
    await service.logout(token);
    await expect(service.logout(token)).rejects.toThrow(unauthorized);
    expect(dao.deleteSession).toHaveBeenCalledTimes(1);
  });

  it("rejects an expired session still awaiting TTL cleanup", async () => {
    records.set(digest(token), { ...records.get(digest(token))!, expiresAt: now });
    await expect(service.logout(token)).rejects.toThrow(unauthorized);
    expect(dao.deleteSession).not.toHaveBeenCalled();
    expect(records.has(digest(token))).toBe(true);
  });

  it("rejects an unknown token without deleting any other session", async () => {
    await expect(service.logout("cd".repeat(32))).rejects.toThrow(unauthorized);
    expect(dao.deleteSession).not.toHaveBeenCalled();
    expect(records.size).toBe(1);
  });

  it.each(["", " ", "dummy-token"])("rejects malformed token %j before storage access", async (invalid) => {
    await expect(service.logout(invalid)).rejects.toThrow(unauthorized);
    expect(dao.refreshSession).not.toHaveBeenCalled();
    expect(dao.deleteSession).not.toHaveBeenCalled();
  });

  it("propagates authorization storage failures without attempting deletion", async () => {
    const error = new Error("Session lookup failed");
    dao.refreshSession.mockRejectedValue(error);
    await expect(service.logout(token)).rejects.toBe(error);
    expect(dao.deleteSession).not.toHaveBeenCalled();
  });

  it("propagates deletion failure instead of claiming a successful logout", async () => {
    const error = new Error("Session deletion failed");
    dao.deleteSession.mockRejectedValue(error);
    await expect(service.logout(token)).rejects.toBe(error);
    expect(records.has(digest(token))).toBe(true);
  });

  it("requires injected authorization instead of simulating logout", async () => {
    await expect(new UserService().logout(token)).rejects.toThrow("Logout dependencies are required.");
  });
});
