// AI-assisted: see AI-ATTRIBUTION.md
import { TransactionCanceledException } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { queryPage } from "./queryPage";
import { randomUUID } from "node:crypto";
import type { FollowCounts, Page } from "../DAOModels";
import type { FollowDAO } from "../FollowDAO";

export class DynamoDBFollowDAO implements FollowDAO {
  public constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly followsTableName: string,
    private readonly usersTableName: string,
    private readonly followersIndexName: string = "FollowersIndex"
  ) {
    if ([followsTableName, usersTableName, followersIndexName].some((name) => name.trim().length === 0)) {
      throw new Error("Follow/user table names and a followers index name are required.");
    }
  }

  public follow(followerAlias: string, followeeAlias: string): Promise<void> {
    return this.changeRelationship(followerAlias, followeeAlias, true);
  }

  public unfollow(followerAlias: string, followeeAlias: string): Promise<void> {
    return this.changeRelationship(followerAlias, followeeAlias, false);
  }

  public async isFollowing(followerAlias: string, followeeAlias: string): Promise<boolean> {
    this.validateAlias(followerAlias);
    this.validateAlias(followeeAlias);
    if (followerAlias === followeeAlias) return false;
    const { Item } = await this.client.send(new GetCommand({
      TableName: this.followsTableName,
      Key: { followerAlias, followeeAlias },
      ConsistentRead: true,
    }));
    return Item !== undefined;
  }

  public async getCounts(userAlias: string): Promise<FollowCounts> {
    this.validateAlias(userAlias);
    const { Item: item } = await this.client.send(new GetCommand({
      TableName: this.usersTableName,
      Key: { alias: userAlias },
      ProjectionExpression: "#followers, #followees",
      ExpressionAttributeNames: { "#followers": "followerCount", "#followees": "followeeCount" },
      ConsistentRead: true,
    }));
    if (item === undefined) throw new Error("[Bad Request] User not found.");
    if (
      !Number.isSafeInteger(item.followerCount) || item.followerCount < 0 ||
      !Number.isSafeInteger(item.followeeCount) || item.followeeCount < 0
    ) {
      throw new Error("Invalid stored follow counts.");
    }
    return { followerCount: item.followerCount, followeeCount: item.followeeCount };
  }

  public getFollowers(userAlias: string, pageSize: number, cursor: string | null): Promise<Page<string, string>> {
    return this.getPage(userAlias, pageSize, cursor, true);
  }

  public getFollowees(userAlias: string, pageSize: number, cursor: string | null): Promise<Page<string, string>> {
    return this.getPage(userAlias, pageSize, cursor, false);
  }

  private async changeRelationship(followerAlias: string, followeeAlias: string, following: boolean): Promise<void> {
    this.validateAlias(followerAlias);
    this.validateAlias(followeeAlias);
    if (followerAlias === followeeAlias) throw new Error("[Bad Request] Users cannot follow themselves.");
    const key = { followerAlias, followeeAlias };
    const relationship = {
      TableName: this.followsTableName,
      ConditionExpression: following ? "attribute_not_exists(#follower)" : "attribute_exists(#follower)",
      ExpressionAttributeNames: { "#follower": "followerAlias" },
    };
    const countUpdate = (alias: string, field: "followerCount" | "followeeCount") => ({
      Update: {
        TableName: this.usersTableName,
        Key: { alias },
        UpdateExpression: "SET #count = #count + :delta",
        ConditionExpression: "attribute_exists(#alias) AND #count BETWEEN :minimum AND :maximum",
        ExpressionAttributeNames: { "#alias": "alias", "#count": field },
        ExpressionAttributeValues: {
          ":delta": following ? 1 : -1,
          ":minimum": following ? 0 : 1,
          ":maximum": following ? Number.MAX_SAFE_INTEGER - 1 : Number.MAX_SAFE_INTEGER,
        },
      },
    });
    try {
      await this.client.send(new TransactWriteCommand({
        ClientRequestToken: randomUUID(),
        TransactItems: [
          following ? { Put: { ...relationship, Item: key } } : { Delete: { ...relationship, Key: key } },
          countUpdate(followerAlias, "followeeCount"),
          countUpdate(followeeAlias, "followerCount"),
        ],
      }));
    } catch (error) {
      if (!(error instanceof TransactionCanceledException)) throw error;
      const reasons = error.CancellationReasons;
      // Never swallow conflicts, throttling, validation errors, or failures
      // whose cancellation reasons are unavailable.
      if (!reasons?.length || reasons.some(({ Code }) => Code !== "None" && Code !== "ConditionalCheckFailed")) {
        throw error;
      }
      // Confirm both accounts exist even for an already-satisfied operation.
      // Zero counts may legitimately fail decrement conditions on repeat unfollow.
      await Promise.all([this.getCounts(followerAlias), this.getCounts(followeeAlias)]);
      if (reasons[0].Code === "ConditionalCheckFailed") return;
      throw error; // Counter invariant failure is not a successful relationship change.
    }
  }

  private async getPage(userAlias: string, pageSize: number, cursor: string | null, followers: boolean): Promise<Page<string, string>> {
    this.validateAlias(userAlias);
    if (cursor !== null) this.validateAlias(cursor);
    const owner = followers ? "followeeAlias" : "followerAlias";
    const other = followers ? "followerAlias" : "followeeAlias";
    return queryPage(this.client, {
      TableName: this.followsTableName,
      ...(followers ? { IndexName: this.followersIndexName } : {}),
      KeyConditionExpression: "#owner = :owner",
      ExpressionAttributeNames: { "#owner": owner, "#other": other },
      ExpressionAttributeValues: { ":owner": userAlias },
      ProjectionExpression: "#other",
      ScanIndexForward: true,
      ConsistentRead: !followers, // Global secondary indexes are eventually consistent.
      ...(cursor === null ? {} : { ExclusiveStartKey: { [owner]: userAlias, [other]: cursor } }),
    }, pageSize, (item) => {
      const alias: unknown = item[other];
      if (typeof alias !== "string" || alias.trim().length === 0) throw new Error("Invalid stored follow relationship.");
      return alias;
    }, (alias) => alias);
  }

  private validateAlias(alias: string): void {
    if (alias.trim().length === 0) throw new Error("[Bad Request] A user alias is required.");
  }
}
