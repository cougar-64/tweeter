import {Presenter, View} from "./Presenter";
import {UserInfoActions} from "../components/userInfo/UserInfoContexts";
import {UserService} from "../model.service/UserService";
import {AuthToken, User} from "tweeter-shared";


export interface AuthView extends View {
    navigate: (url: string) => void;
    setImageUrl: (url: string) => void;
    setImageBytes: (array: Uint8Array) => void;
    setImageFileExtension: (extension: string) => void;
}

export abstract class AuthPresenter extends Presenter<AuthView> {
    protected _userInfoActions: UserInfoActions;
    protected _userService = new UserService();

    public constructor(view: AuthView, userInfoActions: UserInfoActions) {
        super(view);
        this._userInfoActions = userInfoActions;
    }

    public async getIn(alias: string, password: string, rememberMe: boolean, firstName?:
                       string, lastName?: string, originalUrl?: string | undefined,
                       userImageBytes?: Uint8Array, imageFileExtension?: string,
                       ) {
        await this.doFailureReportingOperation(async () => {
            const [user, authToken] = await this.doGetIn(alias, password, rememberMe, firstName,
                                        lastName, originalUrl, userImageBytes, imageFileExtension,
                                        );
            this._userInfoActions.updateUserInfo(user, user, authToken, rememberMe);
            if (firstName === undefined) { // it's a call to login
                if (!!originalUrl) {
                    this.view.navigate(originalUrl);
                }
            }
            this.view.navigate(`/feed/${user.alias}`);
        }, this.itemDescription())
    }

    public abstract itemDescription(): string;
    public abstract doGetIn(alias: string, password: string, rememberMe: boolean, firstName?:
                            string, lastName?: string, originalUrl?: string | undefined,
                             userImageBytes?: Uint8Array, imageFileExtension?: string,
                             ): Promise<[User, AuthToken]>;
}