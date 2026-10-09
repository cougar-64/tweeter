import {AuthItemPresenter, AuthItemView} from "./AuthItemPresenter";
import {UserService} from "../model.service/UserService";
import {useNavigate} from "react-router-dom";
import {UserInfoActionsHook} from "../components/userInfo/UserHooks";

export class LoginPresenter extends AuthItemPresenter {
    private _userService: UserService;
    private _navigate;
    private _updateUserInfo;

    public constructor(view: AuthItemView) {
        super(view)
        this._userService = new UserService();
        this._navigate = useNavigate();
        this._updateUserInfo = UserInfoActionsHook();
    }



    public getIn(alias: string, password: string) {
        return this._userService.login(alias, password);
    }

    public async doGetIn(rememberMe: boolean, originalUrl: string | undefined) {
        try {
            super.isLoading = false;

            const [user, authToken] = await this.getIn(this.alias!, this.password!);

            this._updateUserInfo(user, user, authToken, rememberMe);

            if (!!originalUrl) {
                this._navigate(originalUrl);
            } else {
                this._navigate(`/feed/${user.alias}`);
            }
        } catch (error) {
            this.view.displayErrorMessage(
                `Failed to log user in because of exception: ${error}`,
            );
        } finally {
            super.isLoading = false;
        }
    };
}