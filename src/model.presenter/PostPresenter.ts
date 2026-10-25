import {AuthToken} from "tweeter-shared";
import {StatusService} from "../model.service/StatusService";
import {PLParent, PLPView} from "./PLParent";

export class PostPresenter extends PLParent<PLPView, StatusService>{

    protected serviceFactory(): StatusService {
        return new StatusService();
    }

    public async logout(authToken: AuthToken): Promise<void> {
        await this._service.postStatus(authToken);
    }

}