import {AuthToken} from "tweeter-shared";


export class LogoutPresenter {
    public async logout(authToken: AuthToken): Promise<void> {
        return new Promise((res) => setTimeout(res, 1000));
    }
}