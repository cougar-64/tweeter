import {AuthItemPresenter, AuthItemView} from "./AuthItemPresenter";
import {UserService} from "../model.service/UserService";
import {useNavigate} from "react-router-dom";

export class RegisterPresenter extends AuthItemPresenter {
    private _userService: UserService;
    private _navigate;

    public constructor(view: AuthItemView)
    {
        super(view);
        this._userService = new UserService();
        this._navigate = useNavigate();
    }

    public getIn(alias: string, password: string) {
        if (super.firstName != null && super.lastName != null && super.userItemBytes != null && super.imageFileExtension != null) {
            return this._userService.register(super.firstName, super.lastName, alias, password, super.userItemBytes, super.imageFileExtension);
        }
    }

    public async doGetIn(rememberMe: boolean) {
        try {
            super.isLoading = true;

            const [user, authToken] = await this.getIn(
                this.alias,
                this.password
            );

            updateUserInfo(user, user, authToken, rememberMe);
            this._navigate(`/feed/${user.alias}`);
        } catch (error) {
            this.view.displayErrorMessage(
                `Failed to register user because of exception: ${error}`,
            );
        } finally {
            super.isLoading = false;
        }
    };
}