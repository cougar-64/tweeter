import {AuthToken, User} from "tweeter-shared";
import {UserService} from "../model.service/UserService";

export interface UserItemView {
    addItems: (items: User[]) => void;
    displayErrorMessage: (message: string) => void;
}

export const PAGE_SIZE = 10;

export abstract class UserItemPresenter {

    private _view: UserItemView;
    private _userService: UserService;
    private _hasMoreItems = true
    private _lastItem: User | null = null

    protected constructor(view: UserItemView) {
        this._view = view;
        this._userService = new UserService();
    }

    protected get view() {
        return this._view;
    }

    protected get lastItem() {
        return this._lastItem;
    }

    protected set lastItem(value: User | null) {
        this._lastItem = value;
    }

    public get hasMoreItems() {
        return this._hasMoreItems;
    }

    protected set hasMoreItems(value: boolean) {
        this._hasMoreItems = value;
    }

    reset() {
        this._lastItem = null;
        this._hasMoreItems = true;
    }

    public async getUser (
        authToken: AuthToken,
        alias: string
    ): Promise<User | null> {
        return this._userService.getUser(authToken, alias)
    };

    public abstract loadMoreItems(authToken: AuthToken, userAlias: string): void;
}