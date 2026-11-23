/** @jest-environment node */
/// <reference types="node" />
// AI-assisted: see AI-ATTRIBUTION.md
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BatchWriteCommand, DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { Buffer } from "node:buffer";
import type { StoredStatus } from "../../../tweeter-server/src/model/dao/DAOModels";
import { DynamoDBFeedDAO } from "../../../tweeter-server/src/model/dao/dynamodb/DynamoDBFeedDAO";
import { DynamoDBStatusStore } from "../../../tweeter-server/src/model/dao/dynamodb/DynamoDBStatusStore";

const status = (id = "post-a", timestamp = 1000, alias = "@author"): StoredStatus => ({
  statusId: id, timestamp,
  status: { post: `Post ${id}`, timestamp, statusId: id, user: { alias, firstName: "Test", lastName: "Author", imageUrl: "https://example.com/profile.png" } },
});
const recipients = (size: number) => Array.from({ length: size }, (_, i) => `@reader${i}`);
type Row = ReturnType<DynamoDBStatusStore["toItem"]>;

describe("DynamoDBFeedDAO", () => {
  const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "us-east-1" }));
  let pause: jest.Mock<Promise<void>, [number]>;
  let dao: DynamoDBFeedDAO;
  beforeEach(() => {
    pause = jest.fn().mockResolvedValue(undefined);
    dao = new DynamoDBFeedDAO(client, "feeds", pause);
    jest.spyOn(Math, "random").mockReturnValue(0);
  });
  afterEach(() => jest.restoreAllMocks());
  afterAll(() => client.destroy());

  it("stores a public status copy per recipient while preserving the original author", async () => {
    const send = jest.spyOn(client, "send").mockImplementation(async () => ({ $metadata: {} }));
    const record = status();
    await dao.putEntries(["@amy", "@bob"], record);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toBeInstanceOf(BatchWriteCommand);
    const writes = (send.mock.calls[0][0] as BatchWriteCommand).input.RequestItems!.feeds;
    expect(writes.map((write) => write.PutRequest!.Item)).toEqual(["@amy", "@bob"].map((ownerAlias) => ({
      ownerAlias, postKey: "0000000000001000#post-a", ...record,
    })));
    expect(pause).not.toHaveBeenCalled();
  });

  it("deduplicates recipients before writing, including duplicates across batch boundaries", async () => {
    const send = jest.spyOn(client, "send").mockImplementation(async () => ({ $metadata: {} }));
    const aliases = recipients(26);
    await dao.putEntries([...aliases, aliases[0], aliases[25]], status());
    const batches = send.mock.calls.map(([command]) => (command as BatchWriteCommand).input.RequestItems!.feeds);
    expect(batches.map((batch) => batch.length)).toEqual([25, 1]);
    expect(batches.flat().map((write) => write.PutRequest!.Item!.ownerAlias)).toEqual(aliases);
  });

  it.each([0, 1, 25, 26, 51])("writes %i recipients in batches of at most 25", async (size) => {
    const send = jest.spyOn(client, "send").mockImplementation(async () => ({ $metadata: {} }));
    await dao.putEntries(recipients(size), status());
    expect(send).toHaveBeenCalledTimes(Math.ceil(size / 25));
    const batches = send.mock.calls.map(([command]) => (command as BatchWriteCommand).input.RequestItems!.feeds);
    expect(batches.flat()).toHaveLength(size);
    expect(batches.every((batch) => batch.length > 0 && batch.length <= 25)).toBe(true);
  });

  it("splits below 25 when escaped DynamoDB wire data would exceed 16 MB", async () => {
    const send = jest.spyOn(client, "send").mockImplementation(async () => ({ $metadata: {} }));
    const record = status();
    const large = { ...record, status: { ...record.status, post: "\u0000".repeat(130000) } };
    await dao.putEntries(recipients(25), large);
    expect(send.mock.calls.length).toBeGreaterThan(1);
    let total = 0;
    for (const [command] of send.mock.calls) {
      const writes = (command as BatchWriteCommand).input.RequestItems!.feeds;
      total += writes.length;
      const wire = { RequestItems: { feeds: writes.map((write) => ({ PutRequest: { Item: marshall(write.PutRequest!.Item!) } })) } };
      expect(Buffer.byteLength(JSON.stringify(wire))).toBeLessThanOrEqual(16 * 1024 * 1024);
      expect(writes.length).toBeLessThanOrEqual(25);
    }
    expect(total).toBe(25);
  });

  it("retries only unprocessed entries and completes the current batch before the next", async () => {
    let calls = 0;
    const send = jest.spyOn(client, "send").mockImplementation(async (command) => {
      const writes = (command as BatchWriteCommand).input.RequestItems!.feeds;
      calls++;
      return { UnprocessedItems: { feeds: calls === 1 ? writes.slice(0, 2) : calls === 2 ? writes.slice(0, 1) : [] }, $metadata: {} };
    });
    await dao.putEntries(recipients(26), status());
    const batches = send.mock.calls.map(([command]) => (command as BatchWriteCommand).input.RequestItems!.feeds);
    expect(batches.map((batch) => batch.length)).toEqual([25, 2, 1, 1]);
    expect(batches[1]).toEqual(batches[0].slice(0, 2));
    expect(batches[2]).toEqual(batches[1].slice(0, 1));
    expect(batches[3][0].PutRequest!.Item!.ownerAlias).toBe("@reader25");
    expect(pause.mock.calls.map(([milliseconds]) => milliseconds)).toEqual([25, 50]);
  });

  it("rejects exhausted unprocessed writes and does not start later batches", async () => {
    const send = jest.spyOn(client, "send").mockImplementation(async (command) => ({
      UnprocessedItems: (command as BatchWriteCommand).input.RequestItems, $metadata: {},
    }));
    await expect(dao.putEntries(recipients(26), status())).rejects.toThrow("Feed delivery incomplete: 25 entries remain after 5 attempts.");
    expect(send).toHaveBeenCalledTimes(5);
    expect(pause.mock.calls.map(([milliseconds]) => milliseconds)).toEqual([25, 50, 100, 200]);
    expect(send.mock.calls.every(([command]) => (command as BatchWriteCommand).input.RequestItems!.feeds.length === 25)).toBe(true);
  });

  it.each([undefined, {}, { feeds: [] }])("accepts an empty unprocessed map without another write", async (unprocessed) => {
    const send = jest.spyOn(client, "send").mockImplementation(async () => ({ UnprocessedItems: unprocessed, $metadata: {} }));
    await dao.putEntries(["@amy"], status());
    expect(send).toHaveBeenCalledTimes(1);
    expect(pause).not.toHaveBeenCalled();
  });

  it("waits for the batch response before reporting delivery success", async () => {
    let complete!: () => void;
    const pending = new Promise<void>((resolve) => { complete = resolve; });
    jest.spyOn(client, "send").mockImplementation(async () => { await pending; return { $metadata: {} }; });
    let settled = false;
    const operation = dao.putEntries(["@amy"], status()).then(() => { settled = true; });
    await Promise.resolve();
    expect(settled).toBe(false);
    complete();
    await operation;
    expect(settled).toBe(true);
  });

  it.each([1, 2])("propagates an SDK failure in batch %i instead of reporting success", async (failedBatch) => {
    const error = new Error("DynamoDB unavailable");
    let calls = 0;
    const send = jest.spyOn(client, "send").mockImplementation(async () => {
      if (++calls === failedBatch) throw error;
      return { $metadata: {} };
    });
    await expect(dao.putEntries(recipients(51), status())).rejects.toBe(error);
    expect(send).toHaveBeenCalledTimes(failedBatch);
  });

  it("does not hide backoff failures", async () => {
    const error = new Error("Retry interrupted");
    pause.mockRejectedValue(error);
    const send = jest.spyOn(client, "send").mockImplementation(async (command) => ({
      UnprocessedItems: (command as BatchWriteCommand).input.RequestItems, $metadata: {},
    }));
    await expect(dao.putEntries(["@amy"], status())).rejects.toBe(error);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("validates every recipient before any writes", async () => {
    const send = jest.spyOn(client, "send");
    await expect(dao.putEntries([...recipients(25), " "], status())).rejects.toThrow("[Bad Request] A feed recipient alias is required.");
    expect(send).not.toHaveBeenCalled();
  });

  it("validates the status before writing", async () => {
    const send = jest.spyOn(client, "send");
    await expect(dao.putEntries(["@amy"], { ...status(), timestamp: 999 })).rejects.toThrow("[Bad Request] Invalid status record.");
    expect(send).not.toHaveBeenCalled();
  });

  it("reads precomputed mixed-author entries by feed owner with stable pagination and idempotent replay", async () => {
    const rows = new Map<string, Row>();
    const send = jest.spyOn(client, "send").mockImplementation(async (command) => {
      if (command instanceof BatchWriteCommand) {
        for (const write of command.input.RequestItems!.feeds) {
          const row = write.PutRequest!.Item as Row;
          rows.set(`${row.ownerAlias}|${row.postKey}`, row);
        }
        return { $metadata: {} };
      }
      const input = (command as QueryCommand).input;
      const cursor = input.ExclusiveStartKey?.postKey as string | undefined;
      const candidates = [...rows.values()]
        .filter((row) => row.ownerAlias === input.ExpressionAttributeValues![":owner"] && (!cursor || row.postKey < cursor))
        .sort((a, b) => a.postKey < b.postKey ? 1 : -1);
      const items = candidates.slice(0, input.Limit);
      const last = items[items.length - 1];
      return {
        Items: items,
        LastEvaluatedKey: candidates.length > items.length ? { ownerAlias: last.ownerAlias, postKey: last.postKey } : undefined,
        $metadata: {},
      };
    });
    const records = Array.from({ length: 13 }, (_, i) => status(`id${String(i).padStart(2, "0")}`, 1000 + Math.floor(i / 4), i % 2 ? "@bob" : "@amy"));
    for (const record of records) await dao.putEntries(["@reader", "@other"], record);
    await dao.putEntries(["@reader"], records[0]);
    await dao.putEntries(["@other"], status("not-for-reader", 9999));
    expect(rows.size).toBe(27);
    const first = await dao.getFeed("@reader", 10, null);
    const second = await dao.getFeed("@reader", 10, first.nextCursor);
    const terminal = await dao.getFeed("@reader", 10, second.items[2]);
    expect([first.items.length, second.items.length, terminal.items.length]).toEqual([10, 3, 0]);
    expect(second.nextCursor).toBeNull();
    expect(terminal.nextCursor).toBeNull();
    const expected = [...records].sort((a, b) => b.timestamp - a.timestamp || (a.statusId < b.statusId ? 1 : -1));
    expect([...first.items, ...second.items]).toEqual(expected);
    expect(first.nextCursor!.timestamp).toBe(second.items[0].timestamp);
    const queries = send.mock.calls.map(([command]) => command)
      .filter((command) => command instanceof QueryCommand).map((command) => command as QueryCommand);
    expect(queries).toHaveLength(3);
    expect(queries[0].input).toMatchObject({
      TableName: "feeds", ExpressionAttributeNames: { "#owner": "ownerAlias" },
      ExpressionAttributeValues: { ":owner": "@reader" }, ScanIndexForward: false, ConsistentRead: true,
    });
    expect(queries[1].input.ExclusiveStartKey).toEqual({
      ownerAlias: "@reader", postKey: `${String(first.nextCursor!.timestamp).padStart(16, "0")}#${first.nextCursor!.statusId}`,
    });
  });

  it("returns an empty persisted feed without querying other tables", async () => {
    const send = jest.spyOn(client, "send").mockImplementation(async () => ({ $metadata: {} }));
    await expect(dao.getFeed("@reader", 10, null)).resolves.toEqual({ items: [], nextCursor: null });
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toBeInstanceOf(QueryCommand);
    expect((send.mock.calls[0][0] as QueryCommand).input.TableName).toBe("feeds");
  });

  it("rejects a row returned for another feed owner", async () => {
    const store = new DynamoDBStatusStore(client, "feeds", "ownerAlias");
    jest.spyOn(client, "send").mockImplementation(async () => ({ Items: [store.toItem(status(), "@other")], $metadata: {} }));
    await expect(dao.getFeed("@reader", 10, null)).rejects.toThrow("Invalid stored status record.");
  });

  it("propagates feed query failure", async () => {
    const error = new Error("Query unavailable");
    jest.spyOn(client, "send").mockImplementation(async () => { throw error; });
    await expect(dao.getFeed("@reader", 10, null)).rejects.toBe(error);
  });

  it("requires a feed table name", () => {
    expect(() => new DynamoDBFeedDAO(client, " ")).toThrow("A status table name is required.");
  });
});
