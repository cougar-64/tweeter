import {AuthToken, User} from "tweeter-shared";
import {UserService} from "../model.service/UserService";


export interface UserNavigationView {
    displayErrorMessage: (message: string) => string;
    displayedUser: User | null;
    setDisplayedUser: (user: User) => void;
    authToken: AuthToken | null;
}

export class UserNavigationPresenter {
    private _userService: UserService;
    private _view: UserNavigationView;
    private _navigate: any;
    private _featurePath: string;


    public constructor(view: UserNavigationView, navigate: any, featurePath: string) {
        this._userService = new UserService();
        this._view = view;
        this._navigate = navigate;
        this._featurePath = featurePath;
    }

    public async navigateToUser (event: React.MouseEvent): Promise<void> {
        event.preventDefault();

        try {
            const alias = this.extractAlias(event.target.toString());

            const toUser = await this.getUser(this._view.authToken!, alias);

            if (toUser) {
                if (!toUser.equals(this._view.displayedUser!)) {
                    this._view.setDisplayedUser(toUser);
                    this._navigate(`${this._featurePath}/${toUser.alias}`);
                }
            }
        } catch (error) {
            this._view.displayErrorMessage(
                `Failed to get user because of exception: ${error}`,
            );
        }
    };

    public extractAlias (value: string): string {
        const index = value.indexOf("@");
        return value.substring(index);
    };

    public async getUser (
        authToken: AuthToken,
        alias: string
    ): Promise<User | null> {
        return this._userService.getUser(authToken, alias);
    };
}