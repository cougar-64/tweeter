// AI-assisted: see AI-ATTRIBUTION.md
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { isStatusDto } from "tweeter-shared";
import type { StatusDto } from "tweeter-shared";
import type { Page, StatusCursor, StoredStatus } from "../DAOModels";
import { queryPage } from "./queryPage";

function isCursor(value: unknown): value is StatusCursor {
  if (typeof value !== "object" || value === null) return false;
  const cursor = value as Partial<StatusCursor>;
  return typeof cursor.timestamp === "number" && Number.isSafeInteger(cursor.timestamp) && cursor.timestamp >= 0
    && typeof cursor.statusId === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(cursor.statusId);
}

function isStoredStatus(value: unknown): value is StoredStatus {
  if (!isCursor(value)) return false;
  const status = (value as Partial<StoredStatus>).status;
  return isStatusDto(status) && status.timestamp === value.timestamp && status.post.trim().length > 0;
}

/** Sixteen digits cover every nonnegative JavaScript safe integer timestamp. */
export function statusPostKey(cursor: StatusCursor): string {
  if (!isCursor(cursor)) throw new Error("[Bad Request] Invalid status cursor.");
  return `${String(cursor.timestamp).padStart(16, "0")}#${cursor.statusId}`;
}

function publicStatus(status: StatusDto): StatusDto {
  return {
    post: status.post, timestamp: status.timestamp,
    user: {
      alias: status.user.alias, firstName: status.user.firstName,
      lastName: status.user.lastName, imageUrl: status.user.imageUrl,
    },
  };
}

/** Shared status row encoding and newest-first paging for story/feed storage. */
export class DynamoDBStatusStore {
  public constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly tableName: string,
    private readonly ownerKey: "authorAlias" | "ownerAlias"
  ) {
    if (tableName.trim().length === 0) throw new Error("A status table name is required.");
  }

  public toItem(record: StoredStatus, ownerAlias?: string) {
    if (!isStoredStatus(record)) throw new Error("[Bad Request] Invalid status record.");
    const owner = ownerAlias ?? record.status.user.alias;
    if (owner.trim().length === 0 || (this.ownerKey === "authorAlias" && owner !== record.status.user.alias)) {
      throw new Error("[Bad Request] Invalid status owner.");
    }
    return {
      [this.ownerKey]: owner,
      postKey: statusPostKey(record),
      statusId: record.statusId,
      timestamp: record.timestamp,
      status: publicStatus(record.status),
    };
  }

  public async getPage(ownerAlias: string, pageSize: number, cursor: StatusCursor | null): Promise<Page<StoredStatus, StatusCursor>> {
    if (ownerAlias.trim().length === 0) throw new Error("[Bad Request] A user alias is required.");
    const startKey = cursor === null ? undefined : { [this.ownerKey]: ownerAlias, postKey: statusPostKey(cursor) };
    return queryPage(this.client, {
      TableName: this.tableName,
      KeyConditionExpression: "#owner = :owner",
      ExpressionAttributeNames: { "#owner": this.ownerKey },
      ExpressionAttributeValues: { ":owner": ownerAlias },
      ScanIndexForward: false,
      ConsistentRead: true,
      ...(startKey ? { ExclusiveStartKey: startKey } : {}),
    }, pageSize, (item) => {
      const storedOwner: unknown = item[this.ownerKey];
      const storedKey: unknown = item.postKey;
      if (!isStoredStatus(item) || storedOwner !== ownerAlias
        || storedKey !== statusPostKey(item)
        || (this.ownerKey === "authorAlias" && item.status.user.alias !== ownerAlias)) {
        throw new Error("Invalid stored status record.");
      }
      return { statusId: item.statusId, timestamp: item.timestamp, status: publicStatus(item.status) };
    }, ({ timestamp, statusId }) => ({ timestamp, statusId }));
  }
}
