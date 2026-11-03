// AI-assisted: see AI-ATTRIBUTION.md
import { UserDto } from "../../dto/UserDto";
import { TweeterRequest } from "./TweeterRequest";

export class PagedUserItemRequest extends TweeterRequest {
  public constructor(
    token: string,
    public readonly userAlias: string,
    public readonly pageSize: number,
    public readonly lastItem: UserDto | null
  ) {
    super(token);
  }
}
