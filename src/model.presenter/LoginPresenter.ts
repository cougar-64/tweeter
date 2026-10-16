import { User, AuthToken } from "tweeter-shared";
import {AuthPresenter} from "./AuthPresenter";


export class LoginPresenter extends AuthPresenter {

    public doGetIn(alias: string, password: string, rememberMe: boolean, firstName?: string | undefined, lastName?: string | undefined, originalUrl?: string | undefined, userImageBytes?: Uint8Array | undefined, imageFileExtension?: string | undefined): Promise<[User, AuthToken]> {
        return this._userService!.login(alias, password);
    }

    public itemDescription(): string {
        return "log in";
    }
}