import {AuthToken, Status, User} from "tweeter-shared";
import {StatusService} from "../model.service/StatusService";
import {PLParent, PLPView} from "./PLParent";
import postStatus from "../components/postStatus/PostStatus";

export interface PostView extends PLPView {
    setIsLoading: (val: boolean) => void;
    setPost: (val: string) => void;
}

export class PostPresenter extends PLParent<PostView, StatusService>{

    protected serviceFactory(): StatusService {
        return new StatusService();
    }

    public async post(authToken: AuthToken, status: Status): Promise<void> {
        await this.service.postStatus(authToken, status);
    }

    public async submitPost(post: string, currentUser: User | null, authToken: AuthToken) {
        var postingStatusToastId = "";

        try {
            this._view.setIsLoading(true);
            postingStatusToastId = this._view.displayInfoMessage(
                "Posting status...",
                0,
            );

            const status = new Status(post, currentUser!, Date.now());

            await this.post(authToken!, status);

            this._view.setPost("");
            this._view.displayInfoMessage( "Status posted!", 2000);
        } catch (error) {
            this._view.displayErrorMessage(
                `Failed to post the status because of exception: ${error}`,
            );
        } finally {
            this._view.deleteMessage(postingStatusToastId);
            this._view.setIsLoading(false);
        }
    }

}