import {UserService} from "../model.service/UserService";
import {useNavigate} from "react-router-dom";
import {UserInfoActionsHook} from "../components/userInfo/UserHooks";
import {User} from "tweeter-shared";

export interface LoginView {
    // inputFieldFactory: () => void;
    // switchAuthenticationMethoFactory: () => void;
    navigate: (url: string) => void;
    displayErrorMessage: (message: string) => void;
}

export class LoginPresenter {
    private _view;
    protected _alias: string | null = null;
    protected _password: string | null = null;
    private _userService: UserService | null;

    public constructor(view: LoginView) {
        this._view = view;
        this._userService = new UserService();
    }

    public async login(alias: string, password: string, originalUrl: string | undefined) {
        try {
            const [user, authToken] = await this._userService!.login(alias, password);
            this._userService!.login(alias, password);
            if (!!originalUrl) {
                this._view.navigate(originalUrl);
            } else {
                this._view.navigate(`/feed/${user.alias}`)
            }
        }
        catch (error) {
            this._view.displayErrorMessage(`Failed to log in user because of error ${error}`);
        }
    };
}