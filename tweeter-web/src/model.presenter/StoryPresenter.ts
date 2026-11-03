import {AuthToken, Status} from "tweeter-shared";
import {StatusItemPresenter} from "./StatusItemPresenter";
import {PAGE_SIZE} from "./PagedItemPresenter";

export class StoryPresenter extends StatusItemPresenter {

    protected itemDescription(): string {
        return "story item";
    }

    protected getMoreItems(authToken: AuthToken, userAlias: string): Promise<[Status[], boolean]> {
        return this._service.loadMoreStoryItems(authToken, userAlias, PAGE_SIZE, this.lastItem);
    }
}