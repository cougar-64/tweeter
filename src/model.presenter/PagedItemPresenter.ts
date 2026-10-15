import {Presenter, View} from "./Presenter";
import {AuthToken, User} from "tweeter-shared";
import {UserService} from "../model.service/UserService";
import {Service} from "../model.service/Service";

export interface PagedItemView<T> extends View {
    addItems: (newItems: T[]) => void;
}

export const PAGE_SIZE = 10;

export abstract class PagedItemPresenter<T, U extends Service> extends Presenter<PagedItemView<T>> {
    private _userService = new UserService();
    private _hasMoreItems = true;
    private _lastItem: T | null = null;
    protected _service: U;

    public constructor(view: PagedItemView<T>) {
        super(view);
        this._service = this.serviceFactory();
    }

    protected get service() {
        return this._service;
    }

    protected abstract serviceFactory(): U;

    protected get lastItem() {
        return this._lastItem;
    }

    protected set lastItem(value: T | null) {
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
        return await this._userService.getUser(authToken, alias)
    };

    public async loadMoreItems(authToken: AuthToken, userAlias: string) {
        this.doFailureReportingOperation(async () => {
            const [newItems, hasMore] = await this.getMoreItems(authToken, userAlias);

            this.hasMoreItems = hasMore;
            this.lastItem = newItems.length > 0 ? newItems[newItems.length - 1] : null;
            this.view.addItems(newItems);
        }, this.itemDescription())
    }

    protected abstract itemDescription(): string;
    protected abstract getMoreItems(authToken: AuthToken, userAlias: string): Promise<[T[], boolean]>
}