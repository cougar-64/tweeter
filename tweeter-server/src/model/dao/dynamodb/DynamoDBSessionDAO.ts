// AI-assisted: see AI-ATTRIBUTION.md
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { SessionRecord } from "../DAOModels";
import type { SessionDAO } from "../SessionDAO";

export class DynamoDBSessionDAO implements SessionDAO {
  private static readonly maxRefreshAttempts = 3;

  public constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly tableName: string
  ) {
    if (tableName.trim().length === 0) {
      throw new Error("A sessions table name is required.");
    }
  }

  public async createSession(session: SessionRecord): Promise<void> {
    const record = this.parseSession({ ...session }, session.tokenHash);
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: { ...record },
      ConditionExpression: "attribute_not_exists(#token)",
      ExpressionAttributeNames: { "#token": "tokenHash" },
    }));
  }

  public async refreshSession(tokenHash: string, now: number, inactivitySeconds: number): Promise<SessionRecord | null> {
    if (
      tokenHash.trim().length === 0 ||
      !Number.isSafeInteger(now) || now < 0 ||
      !Number.isSafeInteger(inactivitySeconds) || inactivitySeconds <= 0 ||
      !Number.isSafeInteger(now + inactivitySeconds)
    ) {
      throw new Error("Invalid session refresh parameters.");
    }

    for (let attempt = 0; attempt < DynamoDBSessionDAO.maxRefreshAttempts; attempt++) {
      const { Item: item } = await this.client.send(new GetCommand({
        TableName: this.tableName,
        Key: { tokenHash },
        ConsistentRead: true,
      }));
      if (item === undefined) {
        return null;
      }
      const current = this.parseSession(item, tokenHash);
      // TTL deletion is asynchronous. Enforce expiration even if the item remains.
      if (current.expiresAt <= now) {
        return null;
      }

      const next: SessionRecord = {
        ...current,
        lastActivity: Math.max(current.lastActivity, now),
        expiresAt: Math.max(current.expiresAt, now + inactivitySeconds),
      };
      // Another request may already have recorded activity in this second or later.
      if (next.lastActivity === current.lastActivity && next.expiresAt === current.expiresAt) {
        return current;
      }

      try {
        const { Attributes: updated } = await this.client.send(new UpdateCommand({
          TableName: this.tableName,
          Key: { tokenHash },
          UpdateExpression: "SET #activity = :activity, #expiry = :expiry",
          // Compare-and-swap avoids shortening a newer session. Existence and
          // expiry checks prevent logout/TTL deletion from becoming an upsert.
          ConditionExpression: "attribute_exists(#token) AND #owner = :owner AND #activity = :previousActivity AND #expiry = :previousExpiry AND #expiry > :now",
          ExpressionAttributeNames: {
            "#token": "tokenHash", "#owner": "userAlias",
            "#activity": "lastActivity", "#expiry": "expiresAt",
          },
          ExpressionAttributeValues: {
            ":owner": current.userAlias,
            ":previousActivity": current.lastActivity, ":previousExpiry": current.expiresAt,
            ":now": now, ":activity": next.lastActivity, ":expiry": next.expiresAt,
          },
          ReturnValues: "ALL_NEW",
        }));
        return this.parseSession(updated, tokenHash);
      } catch (error) {
        if (!(error instanceof ConditionalCheckFailedException)) {
          throw error;
        }
        // Re-read after a competing refresh or logout; never retry stale values.
      }
    }
    throw new Error("Session refresh contention limit exceeded.");
  }

  public async deleteSession(tokenHash: string): Promise<void> {
    await this.client.send(new DeleteCommand({
      TableName: this.tableName,
      Key: { tokenHash },
    }));
  }

  private parseSession(item: Record<string, unknown> | undefined, tokenHash: string): SessionRecord {
    if (
      item === undefined || tokenHash.trim().length === 0 || item.tokenHash !== tokenHash ||
      typeof item.userAlias !== "string" || item.userAlias.trim().length === 0 ||
      typeof item.lastActivity !== "number" || !Number.isSafeInteger(item.lastActivity) || item.lastActivity < 0 ||
      typeof item.expiresAt !== "number" || !Number.isSafeInteger(item.expiresAt) || item.expiresAt <= item.lastActivity
    ) {
      throw new Error("Invalid stored session record.");
    }
    return {
      tokenHash, userAlias: item.userAlias,
      lastActivity: item.lastActivity, expiresAt: item.expiresAt,
    };
  }
}
