import {AuthToken, User} from "tweeter-shared";
import {FollowService} from "../model.service/FollowService";

export class UserInfoPresenter {
    private _authToken: AuthToken;
    private _user: User;
    private _selectedUser: User | null;
    private _followService: FollowService;

    public constructor(authToken: AuthToken, user: User, selectedUser: User | null) {
        this._authToken = authToken;
        this._user = user;
        this._selectedUser = selectedUser;
        this._followService = new FollowService();
    }

    public getFollowerStatus() {
        return this._followService.getIsFollowerStatus(this._authToken, this._user, this._selectedUser!);
    }

    public getFolloweeCount() {
        return this._followService.getFolloweeCount(this._authToken, this._user);
    }

    public getFollowerCount() {
        return this._followService.getFollowerCount(this._authToken, this._user);
    }
}