import {AuthToken} from "tweeter-shared";
import {UserService} from "../model.service/UserService";


export class LogoutPresenter {
    private _userService: UserService
    public constructor() {
        this._userService = new UserService()
    }
    public async logout(authToken: AuthToken): Promise<void> {
        await this._userService.logout(authToken);
    }
}