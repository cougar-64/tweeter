// AI-assisted: see AI-ATTRIBUTION.md
import { Status, TweeterResponse } from "tweeter-shared";
import type { StatusService } from "../../model/service/StatusService";
import { getStatusService } from "../config/getStatusService";
import { validatePostStatusRequest } from "../validation/validatePostStatusRequest";

export class PostStatusLambda {
  public constructor(private readonly service?: Pick<StatusService, "postStatus">) {}

  public async handle(request: unknown): Promise<TweeterResponse> {
    validatePostStatusRequest(request);
    await (this.service ?? getStatusService()).postStatus(request.token, Status.fromDto(request.status));
    return new TweeterResponse(true);
  }
}

export const handler = (request: unknown) => new PostStatusLambda().handle(request);
