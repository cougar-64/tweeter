import {AuthToken} from "tweeter-shared";
import {UserService} from "../model.service/UserService";
import {PLParent, PLPView} from "./PLParent";

export interface LogoutView extends PLPView {
    clearUserInfo: () => void;
    navigate: (url: string) => void;
}

export class LogoutPresenter extends PLParent<LogoutView, UserService>{

    protected serviceFactory(): UserService {
        return new UserService();
    }

    public async logout(authToken: AuthToken): Promise<void> {
        await this.service.logout(authToken);
    }

    public async logOut(authToken: AuthToken) {
        const loggingOutToastId = this._view.displayInfoMessage("Logging Out...", 0);

        try {
            await this.logout(authToken!);

            this._view.deleteMessage(loggingOutToastId);
            this._view.clearUserInfo();
            this._view.navigate("/login");
        } catch (error) {
            this._view.displayErrorMessage(
                `Failed to log user out because of exception: ${error}`,
            );
        }
    }
}