/** @jest-environment node */
/// <reference types="node" />
// AI-assisted: see AI-ATTRIBUTION.md
import process from "node:process";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BatchWriteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { loadAWSConfig } from "../../../tweeter-server/src/config/AWSConfig";
import { AWSDAOFactory } from "../../../tweeter-server/src/model/dao/aws/AWSDAOFactory";
import type { DAOFactory } from "../../../tweeter-server/src/model/dao/DAOFactory";
import type { StoredStatus } from "../../../tweeter-server/src/model/dao/DAOModels";

const environment = {
  AWS_REGION: "us-west-2",
  USERS_TABLE_NAME: "configured-users",
  SESSIONS_TABLE_NAME: "configured-sessions",
  FOLLOWS_TABLE_NAME: "configured-follows",
  STORIES_TABLE_NAME: "configured-stories",
  FEEDS_TABLE_NAME: "configured-feeds",
  PROFILE_IMAGES_BUCKET: "configured-images",
};

describe("AWS configuration", () => {
  afterEach(() => jest.restoreAllMocks());

  it("loads resource names and defaults inactivity to 30 minutes in seconds", () => {
    expect(loadAWSConfig(environment)).toEqual({
      region: "us-west-2", usersTableName: "configured-users", sessionsTableName: "configured-sessions",
      profileImagesBucket: "configured-images", sessionInactivitySeconds: 1800,
      followsTableName: "configured-follows",
      storiesTableName: "configured-stories", feedsTableName: "configured-feeds",
    });
  });

  it("uses a configured interval and trims resource names", () => {
    expect(loadAWSConfig({ ...environment, USERS_TABLE_NAME: " users ", SESSION_INACTIVITY_MINUTES: "15" }))
      .toMatchObject({ usersTableName: "users", sessionInactivitySeconds: 900 });
  });

  it("reads process environment when no explicit environment is supplied", () => {
    jest.replaceProperty(process, "env", { ...environment, SESSION_INACTIVITY_MINUTES: "45" });
    expect(loadAWSConfig().sessionInactivitySeconds).toBe(2700);
  });

  it.each(Object.keys(environment))("rejects missing or blank %s without exposing values", (key) => {
    for (const value of [undefined, " "]) {
      expect(() => loadAWSConfig({ ...environment, [key]: value })).toThrow(`Missing required configuration: ${key}.`);
    }
  });

  it.each(["", " ", "0", "-1", "1.5", "NaN", "Infinity", "1e2", "9007199254740991"])(
    "rejects invalid inactivity minutes %j", (minutes) => {
      expect(() => loadAWSConfig({ ...environment, SESSION_INACTIVITY_MINUTES: minutes }))
        .toThrow("SESSION_INACTIVITY_MINUTES must be a positive whole number of minutes.");
    }
  );
});

describe("AWSDAOFactory", () => {
  const documentClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "us-west-2" }));
  const s3Client = new S3Client({ region: "us-west-2" });
  const config = loadAWSConfig(environment);
  const factory: DAOFactory = new AWSDAOFactory(config, { documentClient, s3Client });

  afterEach(() => jest.restoreAllMocks());
  afterAll(() => { documentClient.destroy(); s3Client.destroy(); });

  it("reuses DAO instances without making AWS requests", () => {
    const documentSend = jest.spyOn(documentClient, "send");
    const s3Send = jest.spyOn(s3Client, "send");
    const freshFactory = new AWSDAOFactory(config, { documentClient, s3Client });
    expect(freshFactory.createUserDAO()).toBe(freshFactory.createUserDAO());
    expect(freshFactory.createSessionDAO()).toBe(freshFactory.createSessionDAO());
    expect(freshFactory.createImageDAO()).toBe(freshFactory.createImageDAO());
    expect(freshFactory.createFollowDAO()).toBe(freshFactory.createFollowDAO());
    expect(freshFactory.createStoryDAO()).toBe(freshFactory.createStoryDAO());
    expect(freshFactory.createFeedDAO()).toBe(freshFactory.createFeedDAO());
    expect(documentSend).not.toHaveBeenCalled();
    expect(s3Send).not.toHaveBeenCalled();
  });

  it("routes user and session operations through the shared document client to their configured tables", async () => {
    const send = jest.spyOn(documentClient, "send").mockImplementation(async () => ({ $metadata: {} }));
    const profile = { alias: "@amy", firstName: "Amy", lastName: "Ames", imageUrl: "https://example.com/amy.png" };
    await factory.createUserDAO().createUser(profile, "test-hash");
    await factory.createSessionDAO().createSession({ tokenHash: "digest", userAlias: "@amy", lastActivity: 1000, expiresAt: 2800 });
    await expect(factory.createSessionDAO().refreshSession("missing", 1100, config.sessionInactivitySeconds)).resolves.toBeNull();
    expect((send.mock.calls[0][0] as PutCommand).input.TableName).toBe("configured-users");
    expect((send.mock.calls[1][0] as PutCommand).input.TableName).toBe("configured-sessions");
    expect((send.mock.calls[2][0] as GetCommand).input.TableName).toBe("configured-sessions");
  });

  it("routes uploads to the configured bucket and returns a URL using the configured region", async () => {
    const send = jest.spyOn(s3Client, "send").mockImplementation(async () => ({ $metadata: {} }));
    await expect(factory.createImageDAO().putImage("photo.png", new Uint8Array([1]), "image/png")).resolves.toEqual({
      imageId: "photo.png", url: "https://configured-images.s3.us-west-2.amazonaws.com/image/photo.png",
    });
    expect((send.mock.calls[0][0] as PutObjectCommand).input.Bucket).toBe("configured-images");
  });

  it("routes relationship lookups to the configured follows table", async () => {
    const send = jest.spyOn(documentClient, "send").mockImplementation(async () => ({ $metadata: {} }));
    await expect(factory.createFollowDAO().isFollowing("@amy", "@bob")).resolves.toBe(false);
    expect((send.mock.calls[0][0] as GetCommand).input.TableName).toBe("configured-follows");
  });

  it("routes story and feed writes to separate configured tables through the shared client", async () => {
    const send = jest.spyOn(documentClient, "send").mockImplementation(async () => ({ $metadata: {} }));
    const status: StoredStatus = {
      statusId: "post-a", timestamp: 1000,
      status: { statusId: "post-a", timestamp: 1000, post: "Hello", user: { alias: "@author", firstName: "Test", lastName: "User", imageUrl: "image.png" } },
    };
    await factory.createStoryDAO().putStatus(status);
    await factory.createFeedDAO().putEntries(["@reader"], status);
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0][0]).toBeInstanceOf(PutCommand);
    expect((send.mock.calls[0][0] as PutCommand).input).toMatchObject({
      TableName: "configured-stories", Item: { authorAlias: "@author", statusId: "post-a" },
    });
    expect(send.mock.calls[1][0]).toBeInstanceOf(BatchWriteCommand);
    const requests = (send.mock.calls[1][0] as BatchWriteCommand).input.RequestItems!;
    expect(Object.keys(requests)).toEqual(["configured-feeds"]);
    expect(requests["configured-feeds"][0].PutRequest!.Item).toMatchObject({ ownerAlias: "@reader", status: status.status });
  });

  it("routes story and feed reads to their configured partitions", async () => {
    const send = jest.spyOn(documentClient, "send").mockImplementation(async () => ({ $metadata: {} }));
    await expect(factory.createStoryDAO().getStory("@author", 10, null)).resolves.toEqual({ items: [], nextCursor: null });
    await expect(factory.createFeedDAO().getFeed("@reader", 10, null)).resolves.toEqual({ items: [], nextCursor: null });
    const inputs = send.mock.calls.map(([command]) => (command as QueryCommand).input);
    expect(inputs[0]).toMatchObject({
      TableName: "configured-stories", ExpressionAttributeNames: { "#owner": "authorAlias" },
      ExpressionAttributeValues: { ":owner": "@author" },
    });
    expect(inputs[1]).toMatchObject({
      TableName: "configured-feeds", ExpressionAttributeNames: { "#owner": "ownerAlias" },
      ExpressionAttributeValues: { ":owner": "@reader" },
    });
    expect(send.mock.calls.every(([command]) => command instanceof QueryCommand)).toBe(true);
  });

  it("constructs its default clients from environment configuration without sending requests", () => {
    jest.replaceProperty(process, "env", environment);
    const documentSend = jest.spyOn(DynamoDBDocumentClient.prototype, "send");
    const s3Send = jest.spyOn(S3Client.prototype, "send");
    expect(new AWSDAOFactory().createUserDAO()).toBeDefined();
    expect(documentSend).not.toHaveBeenCalled();
    expect(s3Send).not.toHaveBeenCalled();
  });
});
