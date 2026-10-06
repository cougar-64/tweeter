import {FollowService} from "../model.service/FollowService";
import {AuthToken} from "tweeter-shared";
import {UserItemPresenter, UserItemView} from "./UserItemPresenter";
import { PAGE_SIZE } from "./UserItemPresenter"

export class FollowerPresenter extends UserItemPresenter {
    private _service: FollowService;

    public constructor(view: UserItemView) {
        super(view);
        this._service = new FollowService;
    }

    public async loadMoreItems (authToken: AuthToken, userAlias: string) {
        try {
            const [newItems, hasMore] = await this._service.loadMoreFollowers(
                authToken,
                userAlias,
                PAGE_SIZE,
                this.lastItem
            );

            this.hasMoreItems = hasMore;
            this.lastItem = newItems.length > 0 ? newItems[newItems.length - 1]: null;
            this.view.addItems(newItems);
        } catch (error) {
            this.view.displayErrorMessage(
                `Failed to load followers because of exception: ${error}`,
            );
        }
    };
}

