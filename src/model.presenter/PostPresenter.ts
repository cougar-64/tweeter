import {AuthToken} from "tweeter-shared";
import {StatusService} from "../model.service/StatusService";

export class PostPresenter {
    private _statusService: StatusService;
    public constructor() {
        this._statusService = new StatusService();
    }

    public async logout(authToken: AuthToken): Promise<void> {
        await this._statusService.postStatus(authToken);
    }

}