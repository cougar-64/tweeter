import {AuthToken, User} from "tweeter-shared";
import {FollowService} from "../model.service/FollowService";

export class UserInfoPresenter {
    private _followService: FollowService;

    public constructor() {

        this._followService = new FollowService();
    }

    public getFollowerStatus(authToken: AuthToken, user: User, selectedUser: User) {
        return this._followService.getIsFollowerStatus(authToken, user, selectedUser);
    }

    public getFolloweeCount(authToken: AuthToken, user: User) {
        return this._followService.getFolloweeCount(authToken, user);
    }

    public getFollowerCount(authToken: AuthToken, user: User) {
        return this._followService.getFollowerCount(authToken, user);
    }

    public async follow(authToken: AuthToken, userToFollow: User) {
        await this._followService.follow(authToken, userToFollow);
        const followerCount = await this.getFollowerCount(authToken, userToFollow);
        const followeeCount = await this.getFolloweeCount(authToken, userToFollow);

        return [followerCount, followeeCount];
    }

    public async unfollow(authToken: AuthToken, userToUnfollow: User) {
        await this._followService.unfollow(authToken, userToUnfollow);

        const followerCount = await this.getFollowerCount(authToken, userToUnfollow);
        const followeeCount = await this.getFolloweeCount(authToken, userToUnfollow);

        return [followerCount, followeeCount];
    }
}