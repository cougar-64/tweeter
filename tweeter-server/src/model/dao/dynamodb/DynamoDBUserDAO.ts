// AI-assisted: see AI-ATTRIBUTION.md
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { UserDto } from "tweeter-shared";
import type { UserRecord } from "../DAOModels";
import type { UserDAO } from "../UserDAO";

export class DynamoDBUserDAO implements UserDAO {
  public constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly tableName: string
  ) {
    if (tableName.trim().length === 0) {
      throw new Error("A users table name is required.");
    }
  }

  public async createUser(profile: UserDto, passwordHash: string): Promise<boolean> {
    try {
      await this.client.send(new PutCommand({
        TableName: this.tableName,
        Item: {
          alias: profile.alias,
          firstName: profile.firstName,
          lastName: profile.lastName,
          imageUrl: profile.imageUrl,
          passwordHash,
          followerCount: 0,
          followeeCount: 0,
        },
        // A single conditional write prevents concurrent registrations from
        // replacing an existing profile, password hash, or follow counts.
        ConditionExpression: "attribute_not_exists(#alias)",
        ExpressionAttributeNames: { "#alias": "alias" },
      }));
      return true;
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        return false;
      }
      throw error;
    }
  }

  public async getUser(alias: string): Promise<UserRecord | null> {
    const { Item: item } = await this.client.send(new GetCommand({
      TableName: this.tableName,
      Key: { alias },
      // Login and profile lookup must see a just-created registration.
      ConsistentRead: true,
    }));
    if (item === undefined) {
      return null;
    }

    // Reject corrupt records rather than treating them as missing users or
    // allowing malformed credentials/counts into the service layer.
    if (
      item.alias !== alias ||
      typeof item.firstName !== "string" ||
      typeof item.lastName !== "string" ||
      typeof item.imageUrl !== "string" ||
      typeof item.passwordHash !== "string" || item.passwordHash.length === 0 ||
      !Number.isSafeInteger(item.followerCount) || item.followerCount < 0 ||
      !Number.isSafeInteger(item.followeeCount) || item.followeeCount < 0
    ) {
      throw new Error("Invalid stored user record.");
    }

    // Explicit mapping keeps credential/storage fields out of the public DTO.
    return {
      profile: {
        alias: item.alias,
        firstName: item.firstName,
        lastName: item.lastName,
        imageUrl: item.imageUrl,
      },
      passwordHash: item.passwordHash,
      followerCount: item.followerCount,
      followeeCount: item.followeeCount,
    };
  }
}
