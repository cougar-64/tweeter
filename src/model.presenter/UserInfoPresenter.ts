import {AuthToken, User} from "tweeter-shared";
import {FollowService} from "../model.service/FollowService";

export interface UserInfoView {
    setFolloweeCount: (count: number) => void;
    setFollowerCount: (count: number) => void;
    displayErrorMessage: (message: string) => void;
    setIsFollower: (is: boolean) => void;
}

export class UserInfoPresenter {
    private _followService: FollowService;
    private _view: UserInfoView;

    public constructor(view: UserInfoView) {
        this._view = view;
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

    public async setNumFollowees(authToken: AuthToken, displayedUser: User) {
        try {
            this._view.setFolloweeCount(await this.getFolloweeCount(authToken, displayedUser));
        } catch (error) {
            this._view.displayErrorMessage(
                `Failed to get followees count because of exception: ${error}`,
            );
        }
    }

    public async setNumFollowers(authToken: AuthToken, displayedUser: User) {
        try {
            this._view.setFollowerCount(await this.getFollowerCount(authToken, displayedUser));
        } catch (error) {
            this._view.displayErrorMessage(
                `Failed to get followers count because of exception: ${error}`,
            );
        }
    }

    public async setIsFollowerStatus(authToken: AuthToken, currentUser: User, displayedUser: User) {
        try {
            if (currentUser === displayedUser) {
                this._view.setIsFollower(false);
            } else {
                this._view.setIsFollower(
                    await this.getFollowerStatus(authToken!, currentUser!, displayedUser!),
                );
            }
        } catch (error) {
            this._view.displayErrorMessage(
                `Failed to determine follower status because of exception: ${error}`,
            );
        }
    }
}