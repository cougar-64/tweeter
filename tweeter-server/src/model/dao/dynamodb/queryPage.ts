// AI-assisted: see AI-ATTRIBUTION.md
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { QueryCommandInput, QueryCommandOutput } from "@aws-sdk/lib-dynamodb";
import type { Page } from "../DAOModels";

type QueryItem = NonNullable<QueryCommandOutput["Items"]>[number];

/** Fill an application page plus one lookahead across DynamoDB response boundaries. */
export async function queryPage<T, Cursor>(
  client: DynamoDBDocumentClient,
  input: Omit<QueryCommandInput, "Limit">,
  pageSize: number,
  fromItem: (item: QueryItem) => T,
  cursorFor: (item: T) => Cursor
): Promise<Page<T, Cursor>> {
  if (!Number.isSafeInteger(pageSize) || pageSize <= 0 || !Number.isSafeInteger(pageSize + 1)) {
    throw new Error("[Bad Request] Page size must be a positive safe integer.");
  }
  const items: T[] = [];
  let startKey = input.ExclusiveStartKey;
  do {
    const result = await client.send(new QueryCommand({
      ...input,
      Limit: pageSize + 1 - items.length,
      ...(startKey ? { ExclusiveStartKey: startKey } : {}),
    }));
    for (const item of result.Items ?? []) items.push(fromItem(item));
    startKey = result.LastEvaluatedKey;
  } while (startKey && Object.keys(startKey).length > 0 && items.length <= pageSize);
  return {
    items: items.slice(0, pageSize),
    nextCursor: items.length > pageSize ? cursorFor(items[pageSize - 1]) : null,
  };
}
