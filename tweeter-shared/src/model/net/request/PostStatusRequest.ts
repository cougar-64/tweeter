// AI-assisted: see AI-ATTRIBUTION.md
import type { StatusDto } from "../../dto/StatusDto";
import { AuthenticatedRequest } from "./AuthenticatedRequest";

export class PostStatusRequest extends AuthenticatedRequest {
  public constructor(token: string, public readonly status: StatusDto) {
    super(token);
  }
}
