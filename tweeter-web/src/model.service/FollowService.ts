// AI-assisted: see AI-ATTRIBUTION.md
// view = DUMB! Delegate everything to the presenter

import {AuthToken, FakeData, PagedUserItemRequest, User, UserAliasRequest} from "tweeter-shared";
import {Service} from "./Service";
import {ServerFacade} from "../net/ServerFacade";

export class FollowService implements Service {
    public constructor(private readonly serverFacade: ServerFacade = new ServerFacade()) {}

    public async loadMoreFollowees (
        authToken: AuthToken,
        userAlias: string,
        pageSize: number,
        lastItem: User | null
    ): Promise<[User[], boolean]> {
        const request = new PagedUserItemRequest(
            authToken.token,
            userAlias,
            pageSize,
            lastItem === null ? null : lastItem.dto
        );
        return this.serverFacade.getMoreFollowees(request);
    };

    public async loadMoreFollowers (
        authToken: AuthToken,
        userAlias: string,
        pageSize: number,
        lastItem: User | null
    ): Promise<[User[], boolean]> {
        const request = new PagedUserItemRequest(
            authToken.token,
            userAlias,
            pageSize,
            lastItem === null ? null : lastItem.dto
        );
        return this.serverFacade.getMoreFollowers(request);
    };

    public async getIsFollowerStatus (
        authToken: AuthToken,
        user: User,
        selectedUser: User,
    ): Promise<boolean> {
        // TODO: Replace with the result of calling server
        return FakeData.instance.isFollower();
    };

    public async getFolloweeCount (
        authToken: AuthToken,
        user: User,
    ): Promise<number> {
        return this.serverFacade.getFolloweeCount(new UserAliasRequest(authToken.token, user.alias));
    };

    public async getFollowerCount (
        authToken: AuthToken,
        user: User,
    ): Promise<number> {
        return this.serverFacade.getFollowerCount(new UserAliasRequest(authToken.token, user.alias));
    };

    public async follow(
        authToken: AuthToken,
        userToFollow: User,
    ): Promise<void> {
        await new Promise((f) => setTimeout(f, 2000));
    }

    public async unfollow(
        authToken: AuthToken,
        userToUnfollow: User,
    ): Promise<void> {
        await new Promise((f) => setTimeout(f, 2000));
    }
}
