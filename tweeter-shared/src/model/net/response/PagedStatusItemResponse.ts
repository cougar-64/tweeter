// AI-assisted: see AI-ATTRIBUTION.md
import type { StatusDto } from "../../dto/StatusDto";
import { TweeterResponse } from "./TweeterResponse";

export class PagedStatusItemResponse extends TweeterResponse {
  public constructor(
    success: boolean,
    message: string | null,
    public readonly items: StatusDto[],
    public readonly hasMore: boolean
  ) {
    super(success, message);
  }
}
