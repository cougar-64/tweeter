// AI-assisted: see AI-ATTRIBUTION.md
import { UserDto } from "../../dto/UserDto";
import { TweeterResponse } from "./TweeterResponse";

export class PagedUserItemResponse extends TweeterResponse {
  public constructor(
    success: boolean,
    message: string | null,
    public readonly items: UserDto[],
    public readonly hasMore: boolean
  ) {
    super(success, message);
  }
}
