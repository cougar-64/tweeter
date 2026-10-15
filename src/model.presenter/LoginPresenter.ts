import {UserService} from "../model.service/UserService";
import {UserInfoActions} from "../components/userInfo/UserInfoContexts";
import {Presenter} from "./Presenter";

export interface LoginView {
    navigate: (url: string) => void;
    displayErrorMessage: (message: string) => void;
}

export class LoginPresenter extends Presenter<LoginView>{
    private _userService: UserService | null;
    private _userInfoActions: UserInfoActions;

    public constructor(view: LoginView, userInfoActions: UserInfoActions) {
        super(view);
        this._userService = new UserService();
        this._userInfoActions = userInfoActions;
    }

    public async login(alias: string, password: string, originalUrl: string | undefined, rememberMe: boolean) {
        try {
            const [user, authToken] = await this._userService!.login(alias, password);
            this._userInfoActions!.updateUserInfo(user, user, authToken, rememberMe);
            console.log("user and authToken successfully found")
            if (!!originalUrl) {
                this.view.navigate(originalUrl);
            } else {
                this.view.navigate(`/feed/${user.alias}`)
            }
            console.log("login presenter successful")
        }
        catch (error) {
            this.view.displayErrorMessage(`Failed to log in user because of error ${error}`);
        }
    };
}