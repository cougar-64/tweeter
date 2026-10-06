import {StatusService} from "../model.service/StatusService";
import {AuthToken, Status} from "tweeter-shared";
import {PAGE_SIZE} from "./UserItemPresenter";
import {StatusItemPresenter} from "./StatusItemPresenter";
import {StatusItemView} from "./StatusItemPresenter";

export class StoryPresenter extends StatusItemPresenter {
    private _service: StatusService

    public constructor(view: StatusItemView) {
        super(view);
        this._service = new StatusService()
    }

    public async loadMoreItems(authToken: AuthToken, userAlias: string) {
        try {
            const [newItems, hasMore] = await this._service.loadMoreStoryItems(
                authToken,
                userAlias,
                PAGE_SIZE,
                this.lastItem
            );

            this.hasMoreItems = hasMore;
            this.lastItem = newItems.length > 0 ? newItems[newItems.length - 1] : null;
            this.view.addItems(newItems);
        } catch (error) {
            this.view.displayErrorMessage(
                `Failed to load story items because of exception: ${error}`,
            );
        }
    };
}