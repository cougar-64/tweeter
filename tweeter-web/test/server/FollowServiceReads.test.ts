/** @jest-environment node */
// AI-assisted: see AI-ATTRIBUTION.md
import type { FollowDAO } from "../../../tweeter-server/src/model/dao/FollowDAO";
import { FollowService } from "../../../tweeter-server/src/model/service/FollowService";

const operations = [
  { name: "follower count", run: (service: FollowService) => service.getFollowerCount("token", "@profile"), method: "getCounts" as const },
  { name: "followee count", run: (service: FollowService) => service.getFolloweeCount("token", "@profile"), method: "getCounts" as const },
  { name: "following status", run: (service: FollowService) => service.getIsFollowerStatus("token", "@follower", "@followee"), method: "isFollowing" as const },
];

describe("FollowService persisted relationship reads", () => {
  let dao: jest.Mocked<FollowDAO>;
  let authorization: { authorize: jest.Mock<Promise<string>, [string]> };
  let factory: { createFollowDAO: jest.Mock<FollowDAO, []>; createUserDAO: jest.Mock };
  let service: FollowService;

  beforeEach(() => {
    dao = {
      follow: jest.fn(), unfollow: jest.fn(), isFollowing: jest.fn().mockResolvedValue(false),
      getCounts: jest.fn().mockResolvedValue({ followerCount: 17, followeeCount: 23 }),
      getFollowers: jest.fn(), getFollowees: jest.fn(),
    };
    authorization = { authorize: jest.fn().mockResolvedValue("@actor") };
    factory = { createFollowDAO: jest.fn(() => dao), createUserDAO: jest.fn() };
    service = new FollowService(factory, authorization);
  });

  it("selects the correct stored counter for another user's profile", async () => {
    await expect(service.getFollowerCount("token", "@profile")).resolves.toBe(17);
    await expect(service.getFolloweeCount("token", "@profile")).resolves.toBe(23);
    expect(dao.getCounts).toHaveBeenNthCalledWith(1, "@profile");
    expect(dao.getCounts).toHaveBeenNthCalledWith(2, "@profile");
  });

  it("preserves zero counts", async () => {
    dao.getCounts.mockResolvedValue({ followerCount: 0, followeeCount: 0 });
    await expect(service.getFollowerCount("token", "@profile")).resolves.toBe(0);
    await expect(service.getFolloweeCount("token", "@profile")).resolves.toBe(0);
  });

  it.each([true, false])("preserves status %s and the requested relationship direction", async (result) => {
    dao.isFollowing.mockResolvedValue(result);
    await expect(service.getIsFollowerStatus("token", "@follower", "@followee")).resolves.toBe(result);
    expect(dao.isFollowing).toHaveBeenCalledWith("@follower", "@followee");
    expect(authorization.authorize).toHaveBeenCalledWith("token");
  });

  it("propagates a missing-user count error rather than inventing a zero count", async () => {
    dao.getCounts.mockRejectedValue(new Error("[Bad Request] User not found."));
    await expect(service.getFollowerCount("token", "@missing")).rejects.toThrow("[Bad Request] User not found.");
  });

  describe.each(operations)("$name", ({ run, method }) => {
    it("authenticates before accessing relationship storage and never mutates", async () => {
      await run(service);
      expect(authorization.authorize).toHaveBeenCalledWith("token");
      expect(authorization.authorize.mock.invocationCallOrder[0]).toBeLessThan(dao[method].mock.invocationCallOrder[0]);
      expect(dao.follow).not.toHaveBeenCalled();
      expect(dao.unfollow).not.toHaveBeenCalled();
    });

    it("waits for session validation before resolving the DAO", async () => {
      let finish!: (actor: string) => void;
      authorization.authorize.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
      const operation = run(service);
      expect(factory.createFollowDAO).not.toHaveBeenCalled();
      finish("@actor");
      await operation;
      expect(factory.createFollowDAO).toHaveBeenCalledTimes(1);
    });

    it.each(["[Unauthorized] Invalid or expired authentication token.", "Session store unavailable"])(
      "propagates session failure %s before reading", async (message) => {
        const error = new Error(message);
        authorization.authorize.mockRejectedValue(error);
        await expect(run(service)).rejects.toBe(error);
        expect(factory.createFollowDAO).not.toHaveBeenCalled();
        expect(dao[method]).not.toHaveBeenCalled();
      }
    );

    it("propagates database failures instead of returning a default", async () => {
      const error = new Error("Database unavailable");
      dao[method].mockRejectedValue(error);
      await expect(run(service)).rejects.toBe(error);
    });

    it("requires injected dependencies", async () => {
      await expect(run(new FollowService())).rejects.toThrow("Relationship dependencies are required.");
    });
  });
});
