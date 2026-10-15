import {AuthToken} from "tweeter-shared";
import {UserService} from "../model.service/UserService";
import {PLParent} from "./PLParent";


export class LogoutPresenter extends PLParent<UserService>{

    protected serviceFactory(): UserService {
        return new UserService();
    }

    public async logout(authToken: AuthToken): Promise<void> {
        await this._service.logout(authToken);
    }
}