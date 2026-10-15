import {AuthToken} from "tweeter-shared";
import {StatusService} from "../model.service/StatusService";
import {PLParent} from "./PLParent";

export class PostPresenter extends PLParent<StatusService>{

    protected serviceFactory(): StatusService {
        return new StatusService();
    }

    public async logout(authToken: AuthToken): Promise<void> {
        await this._service.postStatus(authToken);
    }

}