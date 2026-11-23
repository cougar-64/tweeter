// AI-assisted: see AI-ATTRIBUTION.md
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";
import { loadAWSConfig, type AWSConfig } from "../../../config/AWSConfig";
import type { DAOFactory } from "../DAOFactory";
import type { FollowDAO } from "../FollowDAO";
import { DynamoDBFollowDAO } from "../dynamodb/DynamoDBFollowDAO";
import type { ImageDAO } from "../ImageDAO";
import type { SessionDAO } from "../SessionDAO";
import type { UserDAO } from "../UserDAO";
import { DynamoDBSessionDAO } from "../dynamodb/DynamoDBSessionDAO";
import { DynamoDBUserDAO } from "../dynamodb/DynamoDBUserDAO";
import { S3ImageDAO } from "../s3/S3ImageDAO";

export interface AWSDAOClients {
  readonly documentClient: DynamoDBDocumentClient;
  readonly s3Client: S3Client;
}

/** Extend to the complete DAOFactory when the remaining concrete DAOs exist. */
export class AWSDAOFactory implements Omit<DAOFactory, "createStoryDAO" | "createFeedDAO"> {
  private readonly userDAO: UserDAO;
  private readonly sessionDAO: SessionDAO;
  private readonly imageDAO: ImageDAO;
  private readonly followDAO: FollowDAO;

  public constructor(
    config: AWSConfig = loadAWSConfig(),
    clients: AWSDAOClients = {
      documentClient: DynamoDBDocumentClient.from(new DynamoDBClient({ region: config.region })),
      s3Client: new S3Client({ region: config.region }),
    }
  ) {
    this.userDAO = new DynamoDBUserDAO(clients.documentClient, config.usersTableName);
    this.sessionDAO = new DynamoDBSessionDAO(clients.documentClient, config.sessionsTableName);
    this.imageDAO = new S3ImageDAO(clients.s3Client, config.profileImagesBucket, config.region);
    this.followDAO = new DynamoDBFollowDAO(clients.documentClient, config.followsTableName, config.usersTableName);
  }

  public createUserDAO(): UserDAO {
    return this.userDAO;
  }

  public createSessionDAO(): SessionDAO {
    return this.sessionDAO;
  }

  public createImageDAO(): ImageDAO {
    return this.imageDAO;
  }

  public createFollowDAO(): FollowDAO {
    return this.followDAO;
  }
}
