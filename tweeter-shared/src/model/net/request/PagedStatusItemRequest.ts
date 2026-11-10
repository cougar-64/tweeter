// AI-assisted: see AI-ATTRIBUTION.md
import type { StatusDto } from "../../dto/StatusDto";
import { UserAliasRequest } from "./UserAliasRequest";

export class PagedStatusItemRequest extends UserAliasRequest {
  public constructor(
    token: string,
    userAlias: string,
    public readonly pageSize: number,
    public readonly lastItem: StatusDto | null
  ) {
    super(token, userAlias);
  }
}
