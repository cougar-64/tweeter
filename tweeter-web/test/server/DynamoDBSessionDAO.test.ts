/** @jest-environment node */
// AI-assisted: see AI-ATTRIBUTION.md
import { ConditionalCheckFailedException, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBSessionDAO } from "../../../tweeter-server/src/model/dao/dynamodb/DynamoDBSessionDAO";

const session = { tokenHash: "test-token-digest", userAlias: "@amy", lastActivity: 1000, expiresAt: 2800 };
const conflict = () => new ConditionalCheckFailedException({ message: "Condition failed", $metadata: {} });

describe("DynamoDBSessionDAO", () => {
  const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "us-east-1" }));
  const dao = new DynamoDBSessionDAO(client, "test-sessions");

  afterEach(() => jest.restoreAllMocks());
  afterAll(() => client.destroy());

  it("creates a session conditionally with Unix-second TTL and no raw bearer token", async () => {
    const send = jest.spyOn(client, "send").mockImplementation(async () => ({ $metadata: {} }));
    await dao.createSession(session);
    expect(send).toHaveBeenCalledTimes(1);
    const command = send.mock.calls[0][0] as PutCommand;
    expect(command).toBeInstanceOf(PutCommand);
    expect(command.input).toEqual({
      TableName: "test-sessions", Item: session,
      ConditionExpression: "attribute_not_exists(#token)",
      ExpressionAttributeNames: { "#token": "tokenHash" },
    });
    expect(command.input.Item).not.toHaveProperty("token");
  });

  it("propagates a digest collision instead of replacing the existing session", async () => {
    const error = conflict();
    const send = jest.spyOn(client, "send").mockImplementation(async () => { throw error; });
    await expect(dao.createSession(session)).rejects.toBe(error);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("refreshes activity and expiration with a conditional update after a consistent lookup", async () => {
    const refreshed = { ...session, lastActivity: 1100, expiresAt: 2900 };
    const send = jest.spyOn(client, "send")
      .mockImplementationOnce(async () => ({ Item: session, $metadata: {} }))
      .mockImplementationOnce(async () => ({ Attributes: refreshed, $metadata: {} }));
    await expect(dao.refreshSession(session.tokenHash, 1100, 1800)).resolves.toEqual(refreshed);
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0][0]).toBeInstanceOf(GetCommand);
    expect((send.mock.calls[0][0] as GetCommand).input).toEqual({
      TableName: "test-sessions", Key: { tokenHash: session.tokenHash }, ConsistentRead: true,
    });
    const command = send.mock.calls[1][0] as UpdateCommand;
    expect(command).toBeInstanceOf(UpdateCommand);
    expect(command.input).toEqual({
      TableName: "test-sessions", Key: { tokenHash: session.tokenHash },
      UpdateExpression: "SET #activity = :activity, #expiry = :expiry",
      ConditionExpression: "attribute_exists(#token) AND #owner = :owner AND #activity = :previousActivity AND #expiry = :previousExpiry AND #expiry > :now",
      ExpressionAttributeNames: {
        "#token": "tokenHash", "#owner": "userAlias", "#activity": "lastActivity", "#expiry": "expiresAt",
      },
      ExpressionAttributeValues: {
        ":owner": "@amy", ":previousActivity": 1000, ":previousExpiry": 2800,
        ":now": 1100, ":activity": 1100, ":expiry": 2900,
      },
      ReturnValues: "ALL_NEW",
    });
  });

  it.each([2800, 2801])("rejects expired records still awaiting TTL deletion at %i", async (now) => {
    const send = jest.spyOn(client, "send").mockImplementation(async () => ({ Item: session, $metadata: {} }));
    await expect(dao.refreshSession(session.tokenHash, now, 1800)).resolves.toBeNull();
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("returns null for an unknown or logged-out token without creating a record", async () => {
    const send = jest.spyOn(client, "send").mockImplementation(async () => ({ $metadata: {} }));
    await expect(dao.refreshSession(session.tokenHash, 1100, 1800)).resolves.toBeNull();
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toBeInstanceOf(GetCommand);
  });

  it("accepts activity already covered by a newer request without shortening either time", async () => {
    const newer = { ...session, lastActivity: 1200, expiresAt: 3000 };
    const send = jest.spyOn(client, "send").mockImplementation(async () => ({ Item: newer, $metadata: {} }));
    await expect(dao.refreshSession(session.tokenHash, 1100, 1800)).resolves.toEqual(newer);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("does not shorten expiration when the requested inactivity interval is shorter", async () => {
    const refreshed = { ...session, lastActivity: 1100 };
    const send = jest.spyOn(client, "send")
      .mockImplementationOnce(async () => ({ Item: session, $metadata: {} }))
      .mockImplementationOnce(async () => ({ Attributes: refreshed, $metadata: {} }));
    await expect(dao.refreshSession(session.tokenHash, 1100, 60)).resolves.toEqual(refreshed);
    expect((send.mock.calls[1][0] as UpdateCommand).input.ExpressionAttributeValues![":expiry"]).toBe(2800);
  });

  it("re-reads after a competing refresh and keeps the later activity", async () => {
    const newer = { ...session, lastActivity: 1200, expiresAt: 3000 };
    const send = jest.spyOn(client, "send")
      .mockImplementationOnce(async () => ({ Item: session, $metadata: {} }))
      .mockImplementationOnce(async () => { throw conflict(); })
      .mockImplementationOnce(async () => ({ Item: newer, $metadata: {} }));
    await expect(dao.refreshSession(session.tokenHash, 1100, 1800)).resolves.toEqual(newer);
    expect(send).toHaveBeenCalledTimes(3);
  });

  it("retries using the newly read values when another refresh still needs extending", async () => {
    const competing = { ...session, lastActivity: 1050, expiresAt: 2850 };
    const refreshed = { ...session, lastActivity: 1100, expiresAt: 2900 };
    const send = jest.spyOn(client, "send")
      .mockImplementationOnce(async () => ({ Item: session, $metadata: {} }))
      .mockImplementationOnce(async () => { throw conflict(); })
      .mockImplementationOnce(async () => ({ Item: competing, $metadata: {} }))
      .mockImplementationOnce(async () => ({ Attributes: refreshed, $metadata: {} }));
    await expect(dao.refreshSession(session.tokenHash, 1100, 1800)).resolves.toEqual(refreshed);
    expect((send.mock.calls[3][0] as UpdateCommand).input.ExpressionAttributeValues).toMatchObject({
      ":previousActivity": 1050, ":previousExpiry": 2850,
    });
  });

  it("returns null when logout deletes the session between read and update", async () => {
    const send = jest.spyOn(client, "send")
      .mockImplementationOnce(async () => ({ Item: session, $metadata: {} }))
      .mockImplementationOnce(async () => { throw conflict(); })
      .mockImplementationOnce(async () => ({ $metadata: {} }));
    await expect(dao.refreshSession(session.tokenHash, 1100, 1800)).resolves.toBeNull();
    expect(send).toHaveBeenCalledTimes(3);
    expect(send.mock.calls.every(([command]) => !(command instanceof PutCommand))).toBe(true);
  });

  it("bounds contention retries instead of authorizing an unrefreshed session", async () => {
    const send = jest.spyOn(client, "send").mockImplementation(async (command) => {
      if (command instanceof GetCommand) return { Item: session, $metadata: {} };
      throw conflict();
    });
    await expect(dao.refreshSession(session.tokenHash, 1100, 1800)).rejects.toThrow("contention limit");
    expect(send).toHaveBeenCalledTimes(6);
  });

  it("deletes by digest and permits repeated logout", async () => {
    const send = jest.spyOn(client, "send").mockImplementation(async () => ({ $metadata: {} }));
    await dao.deleteSession(session.tokenHash);
    await dao.deleteSession(session.tokenHash);
    expect(send).toHaveBeenCalledTimes(2);
    for (const [command] of send.mock.calls) {
      expect(command).toBeInstanceOf(DeleteCommand);
      expect((command as DeleteCommand).input).toEqual({
        TableName: "test-sessions", Key: { tokenHash: session.tokenHash },
      });
    }
  });

  it.each(["create", "read", "update", "delete"])("propagates infrastructure failures during %s", async (operation) => {
    const error = new Error("Database unavailable");
    jest.spyOn(client, "send").mockImplementation(async (command) => {
      if (operation === "update" && command instanceof GetCommand) return { Item: session, $metadata: {} };
      throw error;
    });
    const promise = operation === "create" ? dao.createSession(session)
      : operation === "delete" ? dao.deleteSession(session.tokenHash)
      : dao.refreshSession(session.tokenHash, 1100, 1800);
    await expect(promise).rejects.toBe(error);
  });

  it.each([
    { ...session, userAlias: "" }, { ...session, tokenHash: "wrong" },
    { ...session, lastActivity: -1 }, { ...session, expiresAt: 1000 },
  ])("rejects corrupt stored sessions", async (item) => {
    jest.spyOn(client, "send").mockImplementation(async () => ({ Item: item, $metadata: {} }));
    await expect(dao.refreshSession(session.tokenHash, 1100, 1800)).rejects.toThrow("Invalid stored session record.");
  });

  it.each([[1100.5, 1800], [-1, 1800], [1100, 0], [1100, -1], [1100, 1.5], [Number.MAX_SAFE_INTEGER, 1800]])(
    "rejects invalid refresh times (%s, %s) before database access", async (now, duration) => {
      const send = jest.spyOn(client, "send");
      await expect(dao.refreshSession(session.tokenHash, now, duration)).rejects.toThrow("Invalid session refresh parameters.");
      expect(send).not.toHaveBeenCalled();
    }
  );

  it("rejects an invalid session before creation", async () => {
    const send = jest.spyOn(client, "send");
    await expect(dao.createSession({ ...session, expiresAt: 0 })).rejects.toThrow("Invalid stored session record.");
    expect(send).not.toHaveBeenCalled();
  });

  it("rejects missing attributes in an update response", async () => {
    jest.spyOn(client, "send")
      .mockImplementationOnce(async () => ({ Item: session, $metadata: {} }))
      .mockImplementationOnce(async () => ({ $metadata: {} }));
    await expect(dao.refreshSession(session.tokenHash, 1100, 1800)).rejects.toThrow("Invalid stored session record.");
  });

  it("rejects empty table configuration", () => {
    expect(() => new DynamoDBSessionDAO(client, " ")).toThrow("A sessions table name is required.");
  });
});
