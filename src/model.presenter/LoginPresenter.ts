import {UserService} from "../model.service/UserService";
import {UserInfoActions} from "../components/userInfo/UserInfoContexts";
import userInfoProvider from "../components/userInfo/UserInfoProvider";

export interface LoginView {
    navigate: (url: string) => void;
    displayErrorMessage: (message: string) => void;
}

export class LoginPresenter {
    private _view;
    private _userService: UserService | null;
    private _userInfoActions: UserInfoActions;

    public constructor(view: LoginView, userInfoActions: UserInfoActions) {
        this._view = view;
        this._userService = new UserService();
        this._userInfoActions = userInfoActions;
    }

    public async login(alias: string, password: string, originalUrl: string | undefined, rememberMe: boolean) {
        try {
            const [user, authToken] = await this._userService!.login(alias, password);
            this._userInfoActions!.updateUserInfo(user, user, authToken, rememberMe);
            console.log("user and authToken successfully found")
            if (!!originalUrl) {
                this._view.navigate(originalUrl);
            } else {
                this._view.navigate(`/feed/${user.alias}`)
            }
            console.log("login presenter successful")
        }
        catch (error) {
            this._view.displayErrorMessage(`Failed to log in user because of error ${error}`);
        }
    };
}