// AI-assisted: see AI-ATTRIBUTION.md
import { UserDto } from "../../dto/UserDto";
import { UserAliasRequest } from "./UserAliasRequest";

export class PagedUserItemRequest extends UserAliasRequest {
  public constructor(
    token: string,
    userAlias: string,
    public readonly pageSize: number,
    public readonly lastItem: UserDto | null
  ) {
    super(token, userAlias);
  }
}
