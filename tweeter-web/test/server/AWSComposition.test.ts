/** @jest-environment node */
/// <reference types="node" />
// AI-assisted: see AI-ATTRIBUTION.md
import process from "node:process";
import { getAWSDependencies } from "../../../tweeter-server/src/lambda/config/getAWSDependencies";
import { getUserService } from "../../../tweeter-server/src/lambda/config/getUserService";
import { getFollowService } from "../../../tweeter-server/src/lambda/config/getFollowService";
import { getStatusService } from "../../../tweeter-server/src/lambda/config/getStatusService";
import { Status, User } from "tweeter-shared";

it("caches user/follow/status services and shares one factory and authorization instance", async () => {
  jest.replaceProperty(process, "env", {
    AWS_REGION: "us-east-1", USERS_TABLE_NAME: "users", SESSIONS_TABLE_NAME: "sessions",
    FOLLOWS_TABLE_NAME: "follows", PROFILE_IMAGES_BUCKET: "images",
    STORIES_TABLE_NAME: "stories", FEEDS_TABLE_NAME: "feeds",
  });
  try {
    const dependencies = getAWSDependencies();
    expect(getAWSDependencies()).toBe(dependencies);
    expect(getUserService()).toBe(getUserService());
    expect(getFollowService()).toBe(getFollowService());
    expect(getStatusService()).toBe(getStatusService());
    const authorize = jest.spyOn(dependencies.authorization, "authorize").mockResolvedValue("@actor");
    const lookup = jest.spyOn(dependencies.factory.createUserDAO(), "getUser").mockResolvedValue(null);
    const follow = jest.spyOn(dependencies.factory.createFollowDAO(), "follow").mockResolvedValue(undefined);
    await expect(getUserService().getUser("token", "@target")).resolves.toBeNull();
    await getFollowService().follow("token", "@target");
    lookup.mockResolvedValue({
      profile: new User("Test", "User", "@actor", "image.png").dto,
      passwordHash: "private-hash", followerCount: 0, followeeCount: 0,
    });
    const save = jest.spyOn(dependencies.factory.createStoryDAO(), "putStatus").mockResolvedValue(undefined);
    jest.spyOn(dependencies.factory.createFollowDAO(), "getFollowers").mockResolvedValue({ items: [], nextCursor: null });
    await getStatusService().postStatus("token", new Status("Hello", new User("Test", "User", "@actor", "image.png"), 0));
    const getStory = jest.spyOn(dependencies.factory.createStoryDAO(), "getStory")
      .mockResolvedValue({ items: [], nextCursor: null });
    await expect(getStatusService().loadMoreStoryItems("token", "@actor", 10, null)).resolves.toEqual([[], false]);
    expect(getStory).toHaveBeenCalledWith("@actor", 10, null);
    const getFeed = jest.spyOn(dependencies.factory.createFeedDAO(), "getFeed")
      .mockResolvedValue({ items: [], nextCursor: null });
    await expect(getStatusService().loadMoreFeedItems("token", "@actor", 10, null)).resolves.toEqual([[], false]);
    expect(getFeed).toHaveBeenCalledWith("@actor", 10, null);
    expect(authorize).toHaveBeenCalledTimes(5);
    expect(save).toHaveBeenCalledTimes(1);
    expect(lookup).toHaveBeenCalledWith("@target");
    expect(follow).toHaveBeenCalledWith("@actor", "@target");
  } finally {
    jest.restoreAllMocks();
  }
});
