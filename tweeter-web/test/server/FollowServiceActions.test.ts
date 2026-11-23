/** @jest-environment node */
// AI-assisted: see AI-ATTRIBUTION.md
import type { FollowDAO } from "../../../tweeter-server/src/model/dao/FollowDAO";
import { FollowService } from "../../../tweeter-server/src/model/service/FollowService";

describe.each(["follow", "unfollow"] as const)("FollowService.%s", (action) => {
  const other = action === "follow" ? "unfollow" : "follow";
  let dao: jest.Mocked<FollowDAO>;
  let authorization: { authorize: jest.Mock<Promise<string>, [string]> };
  let service: FollowService;

  beforeEach(() => {
    dao = {
      follow: jest.fn(), unfollow: jest.fn(), isFollowing: jest.fn(), getCounts: jest.fn(),
      getFollowers: jest.fn(), getFollowees: jest.fn(),
    };
    authorization = { authorize: jest.fn().mockResolvedValue("@actor") };
    service = new FollowService({ createFollowDAO: () => dao, createUserDAO: jest.fn() }, authorization);
  });

  it("derives the acting alias from authentication and passes only the target from the request", async () => {
    await service[action]("opaque-token", "@target");
    expect(authorization.authorize).toHaveBeenCalledWith("opaque-token");
    expect(dao[action]).toHaveBeenCalledWith("@actor", "@target");
    expect(dao[other]).not.toHaveBeenCalled();
    expect(authorization.authorize.mock.invocationCallOrder[0]).toBeLessThan(dao[action].mock.invocationCallOrder[0]);
  });

  it("does not write a relationship until authentication finishes", async () => {
    let complete!: (alias: string) => void;
    authorization.authorize.mockReturnValue(new Promise((resolve) => { complete = resolve; }));
    const operation = service[action]("token", "@target");
    expect(dao[action]).not.toHaveBeenCalled();
    complete("@authenticated");
    await operation;
    expect(dao[action]).toHaveBeenCalledWith("@authenticated", "@target");
  });

  it("waits for the relationship transaction before resolving", async () => {
    let complete!: () => void;
    dao[action].mockReturnValue(new Promise<void>((resolve) => { complete = resolve; }));
    let settled = false;
    const operation = service[action]("token", "@target").then(() => { settled = true; });
    await Promise.resolve();
    expect(settled).toBe(false);
    complete();
    await operation;
    expect(settled).toBe(true);
  });

  it("rejects a self-relationship before mutation", async () => {
    await expect(service[action]("token", "@actor")).rejects.toThrow("[Bad Request] Users cannot follow themselves.");
    expect(dao[action]).not.toHaveBeenCalled();
  });

  it.each(["[Unauthorized] Invalid or expired authentication token.", "Session store unavailable"])("propagates authorization failure %s without mutation", async (message) => {
    const error = new Error(message);
    authorization.authorize.mockRejectedValue(error);
    await expect(service[action]("token", "@target")).rejects.toBe(error);
    expect(dao[action]).not.toHaveBeenCalled();
  });

  it.each(["[Bad Request] User not found.", "Transaction conflict"])("propagates DAO failure %s", async (message) => {
    const error = new Error(message);
    dao[action].mockRejectedValue(error);
    await expect(service[action]("token", "@target")).rejects.toBe(error);
  });

  it("permits repeated actions through the DAO's idempotent operation", async () => {
    await service[action]("token", "@target");
    await service[action]("token", "@target");
    expect(dao[action]).toHaveBeenCalledTimes(2);
  });

  it("requires injection rather than simulating an operation", async () => {
    await expect(new FollowService()[action]("token", "@target")).rejects.toThrow("Relationship dependencies are required.");
  });
});
