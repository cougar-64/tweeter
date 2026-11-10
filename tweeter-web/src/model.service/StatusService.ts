// AI-assisted: see AI-ATTRIBUTION.md
import {AuthToken, PagedStatusItemRequest, Status} from "tweeter-shared";
import {Service} from "./Service";
import {ServerFacade} from "../net/ServerFacade";

export class StatusService implements Service {
    public constructor(private readonly serverFacade: ServerFacade = new ServerFacade()) {}

    public async loadMoreStoryItems (
        authToken: AuthToken,
        userAlias: string,
        pageSize: number,
        lastItem: Status | null
    ): Promise<[Status[], boolean]> {
        return this.serverFacade.getMoreStory(new PagedStatusItemRequest(
            authToken.token, userAlias, pageSize, lastItem === null ? null : lastItem.dto
        ));
    };

    public async loadMoreFeedItems (
        authToken: AuthToken,
        userAlias: string,
        pageSize: number,
        lastItem: Status | null
    ): Promise<[Status[], boolean]> {
        return this.serverFacade.getMoreFeed(new PagedStatusItemRequest(
            authToken.token, userAlias, pageSize, lastItem === null ? null : lastItem.dto
        ));
    };

    public async postStatus(authToken: AuthToken, status: Status) {
        await new Promise((f) => setTimeout(f, 2000));
    }
}
