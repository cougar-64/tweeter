import {UserService} from "../model.service/UserService";
import {UserInfo} from "../components/userInfo/UserInfo";
import {UserInfoActions} from "../components/userInfo/UserInfoContexts";


export interface RegisterView {
    navigate: (url: string) => void;
    displayErrorMessage: (message: string) => void;
}

export class RegisterPresenter {
    private _view;
    private _userService: UserService | null;
    private _userInfoActions: UserInfoActions;

    public constructor(view: RegisterView, userInfoActions: UserInfoActions)
    {
        this._view = view;
        this._userService = new UserService();
        this._userInfoActions = userInfoActions;
    }

    public async register(
        firstName: string,
        lastName: string,
        alias: string,
        password: string,
        userImageBytes: Uint8Array,
        imageFileExtension: string,
        rememberMe: boolean) {
        try {
            const [user, authToken] = await this._userService!.register(
                firstName, lastName, alias, password, userImageBytes, imageFileExtension,
            );
            await this._userService!.register(firstName, lastName, alias, password,
                userImageBytes, imageFileExtension);
            this._userInfoActions.updateUserInfo(user, user, authToken, rememberMe);
            this._view.navigate(`/feed/${user.alias}`);
        } catch (error) {
            this._view.displayErrorMessage(
                `Failed to register user because of exception${error}`,
            );
        }

    }

    // public async doRegister(rememberMe: boolean) {
    //     try {
    //         super.isLoading = true;
    //
    //         const [user, authToken] = await this.getIn(
    //             this.alias,
    //             this.password
    //         );
    //
    //         updateUserInfo(user, user, authToken, rememberMe);
    //         this._view.navigate(`/feed/${user.alias}`);
    //     } catch (error) {
    //         this._view.displayErrorMessage(
    //             `Failed to register user because of exception: ${error}`,
    //         );
    //     } finally {
    //         super.isLoading = false;
    //     }
    // };
}