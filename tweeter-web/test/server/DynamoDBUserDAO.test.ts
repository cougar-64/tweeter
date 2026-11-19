/** @jest-environment node */
// AI-assisted: see AI-ATTRIBUTION.md
import { ConditionalCheckFailedException, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBUserDAO } from "../../../tweeter-server/src/model/dao/dynamodb/DynamoDBUserDAO";

const profile = {
  alias: "@amy", firstName: "Amy", lastName: "Ames", imageUrl: "https://example.com/amy.png",
};
const passwordHash = "test-password-hash";
const storedUser = { ...profile, passwordHash, followerCount: 3, followeeCount: 4 };

describe("DynamoDBUserDAO", () => {
  const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "us-east-1" }));
  const dao = new DynamoDBUserDAO(client, "test-users");

  afterEach(() => jest.restoreAllMocks());
  afterAll(() => client.destroy());

  it("creates a unique user with a hash and zero counts in one conditional write", async () => {
    const send = jest.spyOn(client, "send").mockImplementation(async () => ({ $metadata: {} }));
    await expect(dao.createUser(profile, passwordHash)).resolves.toBe(true);

    expect(send).toHaveBeenCalledTimes(1);
    const command = send.mock.calls[0][0] as PutCommand;
    expect(command).toBeInstanceOf(PutCommand);
    expect(command.input).toEqual({
      TableName: "test-users",
      Item: { ...profile, passwordHash, followerCount: 0, followeeCount: 0 },
      ConditionExpression: "attribute_not_exists(#alias)",
      ExpressionAttributeNames: { "#alias": "alias" },
    });
  });

  it("returns false for a duplicate alias without retrying an unconditional write", async () => {
    const send = jest.spyOn(client, "send").mockImplementation(async () => {
      throw new ConditionalCheckFailedException({ message: "Already exists", $metadata: {} });
    });
    await expect(dao.createUser(profile, passwordHash)).resolves.toBe(false);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("returns the stored profile, credentials, and counts with a consistent key lookup", async () => {
    const send = jest.spyOn(client, "send").mockImplementation(async () => ({ Item: storedUser, $metadata: {} }));
    await expect(dao.getUser(profile.alias)).resolves.toEqual({
      profile, passwordHash, followerCount: 3, followeeCount: 4,
    });
    const command = send.mock.calls[0][0] as GetCommand;
    expect(command).toBeInstanceOf(GetCommand);
    expect(command.input).toEqual({
      TableName: "test-users", Key: { alias: profile.alias }, ConsistentRead: true,
    });
    const user = await dao.getUser(profile.alias);
    expect(user!.profile).not.toHaveProperty("passwordHash");
    expect(user!.profile).not.toHaveProperty("followerCount");
  });

  it("returns null for a missing alias", async () => {
    jest.spyOn(client, "send").mockImplementation(async () => ({ $metadata: {} }));
    await expect(dao.getUser("@missing")).resolves.toBeNull();
  });

  it.each([
    { ...storedUser, passwordHash: undefined },
    { ...storedUser, followerCount: -1 },
    { ...storedUser, followeeCount: 1.5 },
    { ...storedUser, alias: "@someone-else" },
  ])("rejects malformed stored records", async (item) => {
    jest.spyOn(client, "send").mockImplementation(async () => ({ Item: item, $metadata: {} }));
    await expect(dao.getUser(profile.alias)).rejects.toThrow("Invalid stored user record.");
  });

  it.each(["create", "get"])("propagates infrastructure failures during %s", async (operation) => {
    const error = new Error("Database unavailable");
    jest.spyOn(client, "send").mockImplementation(async () => { throw error; });
    await expect(operation === "create" ? dao.createUser(profile, passwordHash) : dao.getUser(profile.alias))
      .rejects.toBe(error);
  });

  it("rejects an empty table configuration", () => {
    expect(() => new DynamoDBUserDAO(client, " ")).toThrow("A users table name is required.");
  });
});
