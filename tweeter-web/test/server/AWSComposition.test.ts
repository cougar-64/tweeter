/** @jest-environment node */
/// <reference types="node" />
// AI-assisted: see AI-ATTRIBUTION.md
import process from "node:process";
import { getAWSDependencies } from "../../../tweeter-server/src/lambda/config/getAWSDependencies";
import { getUserService } from "../../../tweeter-server/src/lambda/config/getUserService";
import { getFollowService } from "../../../tweeter-server/src/lambda/config/getFollowService";

it("caches user/follow services and shares one factory and authorization instance", async () => {
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
    const authorize = jest.spyOn(dependencies.authorization, "authorize").mockResolvedValue("@actor");
    const lookup = jest.spyOn(dependencies.factory.createUserDAO(), "getUser").mockResolvedValue(null);
    const follow = jest.spyOn(dependencies.factory.createFollowDAO(), "follow").mockResolvedValue(undefined);
    await expect(getUserService().getUser("token", "@target")).resolves.toBeNull();
    await getFollowService().follow("token", "@target");
    expect(authorize).toHaveBeenCalledTimes(2);
    expect(lookup).toHaveBeenCalledWith("@target");
    expect(follow).toHaveBeenCalledWith("@actor", "@target");
  } finally {
    jest.restoreAllMocks();
  }
});
