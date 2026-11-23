// AI-assisted: see AI-ATTRIBUTION.md
import { BatchWriteCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { BatchWriteCommandInput } from "@aws-sdk/lib-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { Buffer } from "node:buffer";
import { setTimeout as delay } from "node:timers/promises";
import type { FeedDAO } from "../FeedDAO";
import type { Page, StatusCursor, StoredStatus } from "../DAOModels";
import { DynamoDBStatusStore } from "./DynamoDBStatusStore";

type WriteBatch = NonNullable<BatchWriteCommandInput["RequestItems"]>[string];

export class DynamoDBFeedDAO implements FeedDAO {
  private static readonly maxBatchItems = 25;
  private static readonly maxRequestBytes = 16 * 1024 * 1024;
  private static readonly maxAttempts = 5;
  private readonly store: DynamoDBStatusStore;

  public constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly tableName: string,
    private readonly pause: (milliseconds: number) => Promise<void> = (milliseconds) => delay(milliseconds)
  ) {
    this.store = new DynamoDBStatusStore(client, tableName, "ownerAlias");
  }

  public async putEntries(recipientAliases: readonly string[], status: StoredStatus): Promise<void> {
    const baseItem = this.store.toItem(status);
    const recipients = [...new Set(recipientAliases)];
    if (recipients.some((alias) => typeof alias !== "string" || alias.trim().length === 0)) {
      throw new Error("[Bad Request] A feed recipient alias is required.");
    }
    // Validate all recipients before any writes, and never put the same owner/key
    // twice in one batch. A replay uses the same owner/post key in later calls.
    const overhead = Buffer.byteLength(JSON.stringify({ RequestItems: { [this.tableName]: [] } }));
    let batch: WriteBatch = [];
    let bytes = overhead;
    for (const ownerAlias of recipients) {
      const item = { ...baseItem, ownerAlias };
      const request = { PutRequest: { Item: item } };
      // DynamoDB's wire representation includes type wrappers and JSON escaping.
      // Counting the native document alone can underestimate the 16 MB limit.
      const requestBytes = Buffer.byteLength(JSON.stringify({ PutRequest: { Item: marshall(item) } })) + 1;
      if (overhead + requestBytes > DynamoDBFeedDAO.maxRequestBytes) {
        throw new Error("[Bad Request] A feed entry exceeds the batch request size limit.");
      }
      if (batch.length === DynamoDBFeedDAO.maxBatchItems || bytes + requestBytes > DynamoDBFeedDAO.maxRequestBytes) {
        await this.writeBatch(batch);
        batch = [];
        bytes = overhead;
      }
      batch.push(request);
      bytes += requestBytes;
    }
    if (batch.length > 0) await this.writeBatch(batch);
  }

  public getFeed(userAlias: string, pageSize: number, cursor: StatusCursor | null): Promise<Page<StoredStatus, StatusCursor>> {
    return this.store.getPage(userAlias, pageSize, cursor);
  }

  private async writeBatch(batch: WriteBatch): Promise<void> {
    let pending = batch;
    for (let attempt = 0; attempt < DynamoDBFeedDAO.maxAttempts; attempt++) {
      // The SDK handles retryable thrown service errors; exhausted SDK errors
      // propagate. Successful responses can still contain unprocessed writes.
      const result = await this.client.send(new BatchWriteCommand({ RequestItems: { [this.tableName]: pending } }));
      pending = result.UnprocessedItems?.[this.tableName] ?? [];
      if (pending.length === 0) return;
      if (attempt + 1 < DynamoDBFeedDAO.maxAttempts) {
        const backoff = Math.floor(50 * 2 ** attempt * (0.5 + Math.random() / 2));
        await this.pause(backoff);
      }
    }
    throw new Error(`Feed delivery incomplete: ${pending.length} entries remain after ${DynamoDBFeedDAO.maxAttempts} attempts.`);
  }
}
