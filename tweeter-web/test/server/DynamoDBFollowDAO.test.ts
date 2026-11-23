/** @jest-environment node */
/// <reference types="node" />
// AI-assisted: see AI-ATTRIBUTION.md
import { DynamoDBClient, TransactionCanceledException } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBFollowDAO } from "../../../tweeter-server/src/model/dao/dynamodb/DynamoDBFollowDAO";

const counts = { followerCount: 0, followeeCount: 0 };
const canceled = (reasons?: { Code: string }[]) => new TransactionCanceledException({
  message: "Transaction canceled", $metadata: {}, CancellationReasons: reasons,
});
const directions = [
  { method: "getFollowers" as const, owner: "followeeAlias", other: "followerAlias", index: "reverse-index" },
  { method: "getFollowees" as const, owner: "followerAlias", other: "followeeAlias", index: undefined },
];

describe("DynamoDBFollowDAO", () => {
  const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "us-east-1" }));
  const dao = new DynamoDBFollowDAO(client, "follows", "users", "reverse-index");
  afterEach(() => jest.restoreAllMocks());
  afterAll(() => client.destroy());

  it.each(["follow", "unfollow"] as const)("changes the relationship and both counts in one guarded %s transaction", async (method) => {
    const send = jest.spyOn(client, "send").mockImplementation(async () => ({ $metadata: {} }));
    await dao[method]("@amy", "@bob");
    expect(send).toHaveBeenCalledTimes(1);
    const command = send.mock.calls[0][0] as TransactWriteCommand;
    expect(command).toBeInstanceOf(TransactWriteCommand);
    expect(command.input.ClientRequestToken).toMatch(/^[a-f0-9-]{36}$/);
    const items = command.input.TransactItems!;
    expect(items).toHaveLength(3);
    const relation = method === "follow" ? items[0].Put! : items[0].Delete!;
    expect(relation.TableName).toBe("follows");
    expect(relation.ConditionExpression).toBe(method === "follow" ? "attribute_not_exists(#follower)" : "attribute_exists(#follower)");
    expect(relation.ExpressionAttributeNames).toEqual({ "#follower": "followerAlias" });
    expect(method === "follow" ? items[0].Put!.Item : items[0].Delete!.Key).toEqual({ followerAlias: "@amy", followeeAlias: "@bob" });
    for (const [index, alias, field] of [[1, "@amy", "followeeCount"], [2, "@bob", "followerCount"]] as const) {
      const update = items[index].Update!;
      expect(update.TableName).toBe("users");
      expect(update.Key).toEqual({ alias });
      expect(update.UpdateExpression).toBe("SET #count = #count + :delta");
      expect(update.ExpressionAttributeNames).toEqual({ "#alias": "alias", "#count": field });
      expect(update.ConditionExpression).toBe("attribute_exists(#alias) AND #count BETWEEN :minimum AND :maximum");
      expect(update.ExpressionAttributeValues).toEqual({
        ":delta": method === "follow" ? 1 : -1, ":minimum": method === "follow" ? 0 : 1,
        ":maximum": method === "follow" ? Number.MAX_SAFE_INTEGER - 1 : Number.MAX_SAFE_INTEGER,
      });
    }
  });

  it.each(["follow", "unfollow"] as const)("treats an already-satisfied %s as a no-op after confirming both users exist", async (method) => {
    const send = jest.spyOn(client, "send")
      .mockImplementationOnce(async () => { throw canceled([
        { Code: "ConditionalCheckFailed" },
        { Code: method === "unfollow" ? "ConditionalCheckFailed" : "None" },
        { Code: method === "unfollow" ? "ConditionalCheckFailed" : "None" },
      ]); })
      .mockImplementation(async () => ({ Item: counts, $metadata: {} }));
    await expect(dao[method]("@amy", "@bob")).resolves.toBeUndefined();
    expect(send).toHaveBeenCalledTimes(3);
    expect(send.mock.calls.slice(1).every(([command]) => command instanceof GetCommand)).toBe(true);
    expect(send.mock.calls.slice(1).map(([command]) => (command as GetCommand).input.Key)).toEqual([{ alias: "@amy" }, { alias: "@bob" }]);
  });

  it("rejects a missing user instead of treating its condition failure as a duplicate", async () => {
    jest.spyOn(client, "send")
      .mockImplementationOnce(async () => { throw canceled([{ Code: "None" }, { Code: "None" }, { Code: "ConditionalCheckFailed" }]); })
      .mockImplementation(async () => ({ $metadata: {} }));
    await expect(dao.follow("@amy", "@missing")).rejects.toThrow("[Bad Request] User not found.");
  });

  it("does not swallow a counter invariant failure when both users exist", async () => {
    const error = canceled([{ Code: "None" }, { Code: "ConditionalCheckFailed" }, { Code: "None" }]);
    jest.spyOn(client, "send")
      .mockImplementationOnce(async () => { throw error; })
      .mockImplementation(async () => ({ Item: counts, $metadata: {} }));
    await expect(dao.unfollow("@amy", "@bob")).rejects.toBe(error);
  });

  it.each([
    { label: "missing cancellation reasons", reasons: undefined },
    { label: "transaction conflict", reasons: [{ Code: "TransactionConflict" }] },
    { label: "throttling", reasons: [{ Code: "ProvisionedThroughputExceeded" }] },
    { label: "validation failure alongside a duplicate", reasons: [{ Code: "ConditionalCheckFailed" }, { Code: "ValidationError" }] },
  ])("propagates $label without reporting success", async ({ reasons }) => {
    const error = canceled(reasons);
    const send = jest.spyOn(client, "send").mockImplementation(async () => { throw error; });
    await expect(dao.follow("@amy", "@bob")).rejects.toBe(error);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("performs a consistent relationship lookup in the correct direction", async () => {
    const send = jest.spyOn(client, "send").mockImplementation(async () => ({ Item: { followerAlias: "@amy", followeeAlias: "@bob" }, $metadata: {} }));
    await expect(dao.isFollowing("@amy", "@bob")).resolves.toBe(true);
    expect((send.mock.calls[0][0] as GetCommand).input).toEqual({
      TableName: "follows", Key: { followerAlias: "@amy", followeeAlias: "@bob" }, ConsistentRead: true,
    });
  });

  it("returns false when the relationship does not exist", async () => {
    jest.spyOn(client, "send").mockImplementation(async () => ({ $metadata: {} }));
    await expect(dao.isFollowing("@amy", "@bob")).resolves.toBe(false);
  });

  it("reads stored counts consistently with a projection excluding credentials", async () => {
    const send = jest.spyOn(client, "send").mockImplementation(async () => ({ Item: counts, $metadata: {} }));
    await expect(dao.getCounts("@amy")).resolves.toEqual(counts);
    expect((send.mock.calls[0][0] as GetCommand).input).toEqual({
      TableName: "users", Key: { alias: "@amy" }, ConsistentRead: true,
      ProjectionExpression: "#followers, #followees",
      ExpressionAttributeNames: { "#followers": "followerCount", "#followees": "followeeCount" },
    });
  });

  it("distinguishes a missing user from an existing user with zero counts", async () => {
    jest.spyOn(client, "send").mockImplementation(async () => ({ $metadata: {} }));
    await expect(dao.getCounts("@missing")).rejects.toThrow("[Bad Request] User not found.");
  });

  it.each([{ followerCount: -1, followeeCount: 0 }, { followerCount: 0, followeeCount: 1.5 }, { followerCount: 0 }, { followerCount: "0", followeeCount: 0 }])(
    "rejects invalid stored counts", async (item) => {
      jest.spyOn(client, "send").mockImplementation(async () => ({ Item: item, $metadata: {} }));
      await expect(dao.getCounts("@amy")).rejects.toThrow("Invalid stored follow counts.");
    }
  );

  it.each(directions)("paginates 13 aliases through $method without losing the lookahead item", async ({ method, owner, other, index }) => {
    const aliases = Array.from({ length: 13 }, (_, i) => `@user${String(i + 1).padStart(2, "0")}`);
    const send = jest.spyOn(client, "send").mockImplementation(async (command) => {
      const input = (command as QueryCommand).input;
      const cursor = input.ExclusiveStartKey?.[other] as string | undefined;
      const remaining = aliases.filter((alias) => !cursor || alias > cursor);
      const page = remaining.slice(0, input.Limit);
      return {
        Items: page.map((alias) => ({ [other]: alias })),
        LastEvaluatedKey: remaining.length > page.length ? { [owner]: "@amy", [other]: page[page.length - 1] } : undefined,
        $metadata: {},
      };
    });
    const first = await dao[method]("@amy", 10, null);
    expect(first).toEqual({ items: aliases.slice(0, 10), nextCursor: aliases[9] });
    const second = await dao[method]("@amy", 10, first.nextCursor);
    expect(second).toEqual({ items: aliases.slice(10), nextCursor: null });
    expect(new Set([...first.items, ...second.items]).size).toBe(13);
    await expect(dao[method]("@amy", 10, aliases[12])).resolves.toEqual({ items: [], nextCursor: null });
    const input = (send.mock.calls[0][0] as QueryCommand).input;
    expect(input).toMatchObject({
      TableName: "follows", KeyConditionExpression: "#owner = :owner",
      ExpressionAttributeNames: { "#owner": owner, "#other": other },
      ExpressionAttributeValues: { ":owner": "@amy" }, ProjectionExpression: "#other",
      ConsistentRead: index === undefined, ScanIndexForward: true, Limit: 11,
    });
    expect(input.IndexName).toBe(index);
    expect((send.mock.calls[1][0] as QueryCommand).input.ExclusiveStartKey).toEqual({ [owner]: "@amy", [other]: aliases[9] });
  });

  it("continues across DynamoDB response boundaries to obtain the lookahead", async () => {
    const key = { followerAlias: "@amy", followeeAlias: "@b" };
    const send = jest.spyOn(client, "send")
      .mockImplementationOnce(async () => ({ Items: [{ followeeAlias: "@a" }, { followeeAlias: "@b" }], LastEvaluatedKey: key, $metadata: {} }))
      .mockImplementationOnce(async () => ({ Items: [{ followeeAlias: "@c" }, { followeeAlias: "@d" }], $metadata: {} }));
    await expect(dao.getFollowees("@amy", 3, null)).resolves.toEqual({ items: ["@a", "@b", "@c"], nextCursor: "@c" });
    expect((send.mock.calls[1][0] as QueryCommand).input).toMatchObject({ ExclusiveStartKey: key, Limit: 2 });
  });

  it("does not advertise another page when the final page has exactly pageSize items", async () => {
    jest.spyOn(client, "send").mockImplementation(async () => ({ Items: [{ followeeAlias: "@a" }, { followeeAlias: "@b" }], LastEvaluatedKey: {}, $metadata: {} }));
    await expect(dao.getFollowees("@amy", 2, null)).resolves.toEqual({ items: ["@a", "@b"], nextCursor: null });
  });

  it("rejects malformed relationship items instead of emitting invalid cursors", async () => {
    jest.spyOn(client, "send").mockImplementation(async () => ({ Items: [{}], $metadata: {} }));
    await expect(dao.getFollowees("@amy", 10, null)).rejects.toThrow("Invalid stored follow relationship.");
  });

  it.each(["follow", "unfollow"] as const)("rejects self-%s before a transaction targets the same user twice", async (method) => {
    const send = jest.spyOn(client, "send");
    await expect(dao[method]("@amy", "@amy")).rejects.toThrow("[Bad Request] Users cannot follow themselves.");
    expect(send).not.toHaveBeenCalled();
  });

  it("reports no self-relationship without a database call", async () => {
    const send = jest.spyOn(client, "send");
    await expect(dao.isFollowing("@amy", "@amy")).resolves.toBe(false);
    expect(send).not.toHaveBeenCalled();
  });

  it.each([0, -1, 1.5, NaN, Number.MAX_SAFE_INTEGER])("rejects invalid page size %s", async (size) => {
    const send = jest.spyOn(client, "send");
    await expect(dao.getFollowers("@amy", size, null)).rejects.toThrow("[Bad Request] Page size");
    expect(send).not.toHaveBeenCalled();
  });

  it("rejects blank aliases and cursors before storage access", async () => {
    const send = jest.spyOn(client, "send");
    await expect(dao.follow(" ", "@bob")).rejects.toThrow("[Bad Request] A user alias is required.");
    await expect(dao.getFollowees("@amy", 10, " ")).rejects.toThrow("[Bad Request] A user alias is required.");
    expect(send).not.toHaveBeenCalled();
  });

  it.each(["follow", "unfollow", "isFollowing", "getCounts", "getFollowers", "getFollowees"] as const)("propagates %s infrastructure errors", async (method) => {
    const error = new Error("DynamoDB unavailable");
    jest.spyOn(client, "send").mockImplementation(async () => { throw error; });
    const operation = method === "getCounts" ? dao.getCounts("@amy")
      : method === "getFollowers" || method === "getFollowees" ? dao[method]("@amy", 10, null)
      : dao[method]("@amy", "@bob");
    await expect(operation).rejects.toBe(error);
  });

  it.each([["", "users", "index"], ["follows", " ", "index"], ["follows", "users", " "]])("requires table/index configuration", (follows, users, index) => {
    expect(() => new DynamoDBFollowDAO(client, follows, users, index)).toThrow("Follow/user table names and a followers index name are required.");
  });
});
