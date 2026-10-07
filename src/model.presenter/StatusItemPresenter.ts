import {UserService} from "../model.service/UserService";
import {AuthToken, Status, User} from "tweeter-shared";


export interface StatusItemView {
    addItems: (items: Status[]) => void;
    displayErrorMessage: (message: string) => void;
}

export abstract class StatusItemPresenter {
    private _view: StatusItemView
    private _userService: UserService
    private _lastItem: Status | null = null
    private _hasMoreItems = true

    protected constructor(view: StatusItemView) {
        this._view = view
        this._userService = new UserService()
    }

    protected get view() {
        return this._view;
    }

    protected get lastItem() {
        return this._lastItem;
    }

    protected set lastItem(value: Status | null) {
        this._lastItem = value
    }

    public get hasMoreItems() {
        return this._hasMoreItems;
    }

    protected set hasMoreItems(value: boolean) {
        this._hasMoreItems = value
    }

    reset() {
        this._lastItem = null
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