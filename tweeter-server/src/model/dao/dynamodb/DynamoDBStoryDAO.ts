// AI-assisted: see AI-ATTRIBUTION.md
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { Page, StatusCursor, StoredStatus } from "../DAOModels";
import type { StoryDAO } from "../StoryDAO";
import { DynamoDBStatusStore } from "./DynamoDBStatusStore";

export class DynamoDBStoryDAO implements StoryDAO {
  private readonly store: DynamoDBStatusStore;

  public constructor(private readonly client: DynamoDBDocumentClient, private readonly tableName: string) {
    this.store = new DynamoDBStatusStore(client, tableName, "authorAlias");
  }

  public async putStatus(status: StoredStatus): Promise<void> {
    // Replaying the same immutable status writes the same author/post key.
    await this.client.send(new PutCommand({ TableName: this.tableName, Item: this.store.toItem(status) }));
  }

  public getStory(userAlias: string, pageSize: number, cursor: StatusCursor | null): Promise<Page<StoredStatus, StatusCursor>> {
    return this.store.getPage(userAlias, pageSize, cursor);
  }
}
