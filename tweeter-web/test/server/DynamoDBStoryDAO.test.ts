/** @jest-environment node */
/// <reference types="node" />
// AI-assisted: see AI-ATTRIBUTION.md
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { StoredStatus } from "../../../tweeter-server/src/model/dao/DAOModels";
import { DynamoDBStoryDAO } from "../../../tweeter-server/src/model/dao/dynamodb/DynamoDBStoryDAO";
import { DynamoDBStatusStore, statusPostKey } from "../../../tweeter-server/src/model/dao/dynamodb/DynamoDBStatusStore";

const status = (id = "post-a", timestamp = 1000, alias = "@amy"): StoredStatus => ({
  statusId: id, timestamp,
  status: {
    post: `Post ${id}: @bob https://example.com`, timestamp, statusId: id,
    user: { alias, firstName: "Amy", lastName: "Ames", imageUrl: "https://example.com/amy.png" },
  },
});
type Row = ReturnType<DynamoDBStatusStore["toItem"]>;

describe("DynamoDBStoryDAO", () => {
  const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "us-east-1" }));
  const dao = new DynamoDBStoryDAO(client, "stories");
  const store = new DynamoDBStatusStore(client, "stories", "authorAlias");
  afterEach(() => jest.restoreAllMocks());
  afterAll(() => client.destroy());

  it("persists an author partition and stable timestamp/ID key with the public status snapshot", async () => {
    const send = jest.spyOn(client, "send").mockImplementation(async () => ({ $metadata: {} }));
    const record = status();
    await dao.putStatus(record);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toBeInstanceOf(PutCommand);
    expect((send.mock.calls[0][0] as PutCommand).input).toEqual({
      TableName: "stories",
      Item: { authorAlias: "@amy", postKey: "0000000000001000#post-a", ...record },
    });
  });

  it("paginates 13 records newest first, preserves timestamp ties, isolates authors, and makes identical replays idempotent", async () => {
    const rows = new Map<string, Row>();
    const send = jest.spyOn(client, "send").mockImplementation(async (command) => {
      if (command instanceof PutCommand) {
        const row = command.input.Item as Row;
        rows.set(`${row.authorAlias}|${row.postKey}`, row);
        return { $metadata: {} };
      }
      const input = (command as QueryCommand).input;
      const cursor = input.ExclusiveStartKey?.postKey as string | undefined;
      const candidates = [...rows.values()]
        .filter((row) => row.authorAlias === input.ExpressionAttributeValues![":owner"] && (!cursor || row.postKey < cursor))
        .sort((a, b) => a.postKey < b.postKey ? 1 : -1);
      const items = candidates.slice(0, input.Limit);
      const last = items[items.length - 1];
      return {
        Items: items,
        LastEvaluatedKey: candidates.length > items.length ? { authorAlias: last.authorAlias, postKey: last.postKey } : undefined,
        $metadata: {},
      };
    });
    const records = Array.from({ length: 13 }, (_, i) => status(`id${String(i).padStart(2, "0")}`, 1000 + Math.floor(i / 4)));
    for (const record of records) await dao.putStatus(record);
    await dao.putStatus(records[0]);
    await dao.putStatus(status("other-author", 9999, "@bob"));
    expect(rows.size).toBe(14);
    const first = await dao.getStory("@amy", 10, null);
    const second = await dao.getStory("@amy", 10, first.nextCursor);
    const last = second.items[second.items.length - 1];
    const terminal = await dao.getStory("@amy", 10, last);
    expect([first.items.length, second.items.length, terminal.items.length]).toEqual([10, 3, 0]);
    expect(second.nextCursor).toBeNull();
    expect(terminal.nextCursor).toBeNull();
    const expected = [...records].sort((a, b) => b.timestamp - a.timestamp || (a.statusId < b.statusId ? 1 : -1));
    expect([...first.items, ...second.items]).toEqual(expected);
    expect(new Set([...first.items, ...second.items].map((record) => record.statusId)).size).toBe(13);
    expect(first.nextCursor).toEqual({ timestamp: expected[9].timestamp, statusId: expected[9].statusId });
    expect(first.nextCursor!.timestamp).toBe(second.items[0].timestamp);
    const query = send.mock.calls.map(([command]) => command).find((command) => command instanceof QueryCommand) as QueryCommand;
    expect(query.input).toMatchObject({
      TableName: "stories", KeyConditionExpression: "#owner = :owner",
      ExpressionAttributeNames: { "#owner": "authorAlias" }, ExpressionAttributeValues: { ":owner": "@amy" },
      ConsistentRead: true, ScanIndexForward: false, Limit: 11,
    });
    expect(query.input).not.toHaveProperty("FilterExpression");
  });

  it("translates the application cursor to an exclusive database key", async () => {
    const send = jest.spyOn(client, "send").mockImplementation(async () => ({ $metadata: {} }));
    await expect(dao.getStory("@amy", 10, { timestamp: 1000, statusId: "post-a" })).resolves.toEqual({ items: [], nextCursor: null });
    expect((send.mock.calls[0][0] as QueryCommand).input.ExclusiveStartKey).toEqual({
      authorAlias: "@amy", postKey: "0000000000001000#post-a",
    });
  });

  it("fills a page plus lookahead across DynamoDB response boundaries", async () => {
    const records = [status("d", 4), status("c", 3), status("b", 2), status("a", 1)];
    const key = { authorAlias: "@amy", postKey: statusPostKey(records[1]) };
    const send = jest.spyOn(client, "send")
      .mockImplementationOnce(async () => ({ Items: records.slice(0, 2).map((record) => store.toItem(record)), LastEvaluatedKey: key, $metadata: {} }))
      .mockImplementationOnce(async () => ({ Items: records.slice(2).map((record) => store.toItem(record)), $metadata: {} }));
    await expect(dao.getStory("@amy", 3, null)).resolves.toEqual({ items: records.slice(0, 3), nextCursor: { timestamp: 2, statusId: "b" } });
    expect((send.mock.calls[1][0] as QueryCommand).input).toMatchObject({ ExclusiveStartKey: key, Limit: 2 });
  });

  it("handles an empty internal response with a continuation key", async () => {
    const send = jest.spyOn(client, "send")
      .mockImplementationOnce(async () => ({ Items: [], LastEvaluatedKey: { authorAlias: "@amy", postKey: "boundary" }, $metadata: {} }))
      .mockImplementationOnce(async () => ({ Items: [store.toItem(status())], $metadata: {} }));
    await expect(dao.getStory("@amy", 10, null)).resolves.toEqual({ items: [status()], nextCursor: null });
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("does not advertise another page when exactly pageSize records remain", async () => {
    jest.spyOn(client, "send").mockImplementation(async () => ({ Items: [store.toItem(status())], LastEvaluatedKey: {}, $metadata: {} }));
    await expect(dao.getStory("@amy", 1, null)).resolves.toEqual({ items: [status()], nextCursor: null });
  });

  it("copies only public fields on both writes and reads", async () => {
    const record = status();
    const enriched = { ...record, passwordHash: "private", status: { ...record.status, token: "secret", user: { ...record.status.user, passwordHash: "private" } } };
    const send = jest.spyOn(client, "send").mockImplementation(async () => ({ $metadata: {} }));
    await dao.putStatus(enriched);
    expect((send.mock.calls[0][0] as PutCommand).input.Item).toEqual(store.toItem(record));
    send.mockImplementation(async () => ({ Items: [{ ...store.toItem(record), ...enriched }], $metadata: {} }));
    await expect(dao.getStory("@amy", 10, null)).resolves.toEqual({ items: [record], nextCursor: null });
  });

  it("adds the authoritative record ID to legacy status payloads on writes and reads", async () => {
    const record = status();
    const { statusId: _id, ...legacy } = record.status;
    const send = jest.spyOn(client, "send").mockImplementation(async () => ({ $metadata: {} }));
    await dao.putStatus({ ...record, status: legacy });
    const row = (send.mock.calls[0][0] as PutCommand).input.Item!;
    expect(row.status.statusId).toBe(record.statusId);
    send.mockImplementation(async () => ({ Items: [{ ...row, status: legacy }], $metadata: {} }));
    await expect(dao.getStory("@amy", 10, null)).resolves.toEqual({ items: [record], nextCursor: null });
  });

  it.each([
    { ...status(), timestamp: 1001 },
    { ...status(), statusId: "invalid#id" },
    { ...status(), statusId: "different-valid-id" },
    { ...status(), status: { ...status().status, post: " " } },
    { ...status(), status: { ...status().status, user: { ...status().status.user, alias: " " } } },
  ])("rejects invalid status writes before contacting DynamoDB", async (record) => {
    const send = jest.spyOn(client, "send");
    await expect(dao.putStatus(record)).rejects.toThrow("[Bad Request] Invalid status record.");
    expect(send).not.toHaveBeenCalled();
  });

  it.each([
    { timestamp: -1, statusId: "a" }, { timestamp: 1.5, statusId: "a" },
    { timestamp: Number.MAX_SAFE_INTEGER + 1, statusId: "a" }, { timestamp: 1000, statusId: "" },
    { timestamp: 1000, statusId: "bad#id" }, { timestamp: 1000, statusId: "a".repeat(129) },
  ])("rejects invalid cursors before querying", async (cursor) => {
    const send = jest.spyOn(client, "send");
    await expect(dao.getStory("@amy", 10, cursor)).rejects.toThrow("[Bad Request] Invalid status cursor.");
    expect(send).not.toHaveBeenCalled();
  });

  it.each([0, -1, 1.5, NaN, Number.MAX_SAFE_INTEGER])("rejects invalid page size %s", async (size) => {
    const send = jest.spyOn(client, "send");
    await expect(dao.getStory("@amy", size, null)).rejects.toThrow("[Bad Request] Page size");
    expect(send).not.toHaveBeenCalled();
  });

  it.each([
    { ...store.toItem(status()), authorAlias: "@bob" },
    { ...store.toItem(status()), postKey: "wrong" },
    { ...store.toItem(status()), timestamp: 999 },
    { ...store.toItem(status()), status: status("a", 1000, "@bob").status },
    { ...store.toItem(status()), statusId: "" },
  ])("rejects corrupt or cross-author stored records", async (item) => {
    jest.spyOn(client, "send").mockImplementation(async () => ({ Items: [item], $metadata: {} }));
    await expect(dao.getStory("@amy", 10, null)).rejects.toThrow("Invalid stored status record.");
  });

  it.each(["put", "query"])("propagates %s storage errors", async (operation) => {
    const error = new Error("Database unavailable");
    jest.spyOn(client, "send").mockImplementation(async () => { throw error; });
    await expect(operation === "put" ? dao.putStatus(status()) : dao.getStory("@amy", 10, null)).rejects.toBe(error);
  });

  it("uses fixed-width keys at zero and the maximum safe timestamp", () => {
    expect(statusPostKey({ timestamp: 0, statusId: "a" })).toBe("0000000000000000#a");
    expect(statusPostKey({ timestamp: Number.MAX_SAFE_INTEGER, statusId: "a" })).toBe("9007199254740991#a");
    expect(statusPostKey({ timestamp: 99, statusId: "z" }) < statusPostKey({ timestamp: 100, statusId: "a" })).toBe(true);
  });

  it("rejects blank aliases and table configuration", async () => {
    const send = jest.spyOn(client, "send");
    await expect(dao.getStory(" ", 10, null)).rejects.toThrow("[Bad Request] A user alias is required.");
    expect(send).not.toHaveBeenCalled();
    expect(() => new DynamoDBStoryDAO(client, " ")).toThrow("A status table name is required.");
  });
});
