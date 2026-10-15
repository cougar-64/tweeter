import {AuthToken, User} from "tweeter-shared";
import {UserService} from "../model.service/UserService";
import {Presenter, View} from "./Presenter";


export interface UserNavigationView extends View {
    displayErrorMessage: (message: string) => string;
    displayedUser: User | null;
    setDisplayedUser: (user: User) => void;
    authToken: AuthToken | null;
}

export class UserNavigationPresenter extends Presenter<UserNavigationView>{
    private _userService: UserService;
    private _navigate: any;
    private _featurePath: string;


    public constructor(view: UserNavigationView, navigate: any, featurePath: string) {
        super(view);
        this._userService = new UserService();
        this._navigate = navigate;
        this._featurePath = featurePath;
    }

    public async navigateToUser (event: React.MouseEvent): Promise<void> {
        event.preventDefault();

        try {
            const alias = this.extractAlias(event.target.toString());

            const toUser = await this.getUser(this.view.authToken!, alias);

            if (toUser) {
                if (!toUser.equals(this.view.displayedUser!)) {
                    this.view.setDisplayedUser(toUser);
                    this._navigate(`${this._featurePath}/${toUser.alias}`);
                }
            }
        } catch (error) {
            this.view.displayErrorMessage(
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
        return await this._userService.getUser(authToken, alias);
    };
}