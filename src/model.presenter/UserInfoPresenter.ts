import {AuthToken, User} from "tweeter-shared";
import {FollowService} from "../model.service/FollowService";
import {Presenter, View} from "./Presenter";

export interface UserInfoView extends View {
    setFolloweeCount: (count: number) => void;
    setFollowerCount: (count: number) => void;
    displayErrorMessage: (message: string) => void;
    setIsFollower: (is: boolean) => void;
}

export class UserInfoPresenter extends Presenter<UserInfoView>{
    private _followService: FollowService;

    public constructor(view: UserInfoView) {
        super(view);
        this._followService = new FollowService();
    }

    public async getFollowerStatus(authToken: AuthToken, user: User, selectedUser: User) {
        return await this._followService.getIsFollowerStatus(authToken, user, selectedUser);
    }

    public async getFolloweeCount(authToken: AuthToken, user: User) {
        return await this._followService.getFolloweeCount(authToken, user);
    }

    public async getFollowerCount(authToken: AuthToken, user: User) {
        return await this._followService.getFollowerCount(authToken, user);
    }

    public async follow(authToken: AuthToken, userToFollow: User) {
        await this._followService.follow(authToken, userToFollow);
        return this.getFollowInformation(authToken, userToFollow);
    }

    public async unfollow(authToken: AuthToken, userToUnfollow: User) {
        await this._followService.unfollow(authToken, userToUnfollow);
        return this.getFollowInformation(authToken, userToUnfollow);
    }

    public async setNumFollowees(authToken: AuthToken, displayedUser: User) {
        await this.doFailureReportingOperation(async () => {
            return this.view.setFolloweeCount(await this.getFolloweeCount(authToken, displayedUser));
        }, "get followees count");
    }

    public async setNumFollowers(authToken: AuthToken, displayedUser: User) {
        await this.doFailureReportingOperation(async () => {
            return this.view.setFollowerCount(await this.getFollowerCount(authToken, displayedUser));
        }, "get followers count");
    }

    public async setIsFollowerStatus(authToken: AuthToken, currentUser: User, displayedUser: User) {
        await this.doFailureReportingOperation(async () => {
            if (currentUser === displayedUser) {
                this.view.setIsFollower(false);
            } else {
                this.view.setIsFollower(
                    await this.getFollowerStatus(authToken!, currentUser!, displayedUser!),
                );
            }
        }, "determine follower status");
    }

    public async getFollowInformation(authToken: AuthToken, userToFollow: User) {
        const followerCount = await this.getFollowerCount(authToken, userToFollow);
        const followeeCount = await this.getFolloweeCount(authToken, userToFollow);

        return [followerCount, followeeCount];
    }
}