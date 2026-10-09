import {AuthItemPresenter, AuthItemView} from "./AuthItemPresenter";
import {UserService} from "../model.service/UserService";
import {useNavigate} from "react-router-dom";

export interface AuthItemView {
    // inputFieldFactory: () => void;
    // switchAuthenticationMethoFactory: () => void;
    displayErrorMessage: (message: string) => void;
}

export class RegisterPresenter {
    private _view;
    protected _alias: string;
    protected _password: string;
    protected _firstName: string | null = null;
    protected _lastName: string | null = null;
    protected _userImageBytes: Uint8Array | null = null;
    protected _imageFileExtension: string | null = null;
    protected _isLoading: boolean = false;

    public constructor(view: AuthItemView)
    {
        this._view = view;
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