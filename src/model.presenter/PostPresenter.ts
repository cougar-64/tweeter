import {AuthToken} from "tweeter-shared";


export class PostPresenter {

    public async logout(authToken: AuthToken): Promise<void> {
        await new Promise((f) => setTimeout(f, 2000));
    }
}