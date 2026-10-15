import {UserService} from "../model.service/UserService";
import {UserInfo} from "../components/userInfo/UserInfo";
import {UserInfoActions} from "../components/userInfo/UserInfoContexts";
import {Buffer} from "buffer";
import {Presenter, View} from "./Presenter";


export interface RegisterView extends View{
    navigate: (url: string) => void;
    displayErrorMessage: (message: string) => void;
    setImageUrl: (url: string) => void;
    setImageBytes: (array: Uint8Array) => void;
    setImageFileExtension: (extension: string) => void;
}

export class RegisterPresenter extends Presenter<RegisterView>{
    private _userService: UserService | null;
    private _userInfoActions: UserInfoActions;

    public constructor(view: RegisterView, userInfoActions: UserInfoActions) {
        super(view);
        this._userService = new UserService();
        this._userInfoActions = userInfoActions;
    }

    public async register(
        firstName: string,
        lastName: string,
        alias: string,
        password: string,
        userImageBytes: Uint8Array,
        imageFileExtension: string,
        rememberMe: boolean) {
        try {
            const [user, authToken] = await this._userService!.register(
                firstName, lastName, alias, password, userImageBytes, imageFileExtension,
            );
            this._userInfoActions.updateUserInfo(user, user, authToken, rememberMe);
            this.view.navigate(`/feed/${user.alias}`);
        } catch (error) {
            this.view.displayErrorMessage(
                `Failed to register user because of exception${error}`,
            );
        }

    }

    public async handleImageFile(file: File | undefined) {
        if (file) {
            this.view.setImageUrl(URL.createObjectURL(file));

            const reader = new FileReader();
            reader.onload = (event: ProgressEvent<FileReader>) => {
                const imageStringBase64 = event.target?.result as string;

                // Remove unnecessary file metadata from the start of the string.
                const imageStringBase64BufferContents =
                    imageStringBase64.split("base64,")[1];

                const bytes: Uint8Array = Buffer.from(
                    imageStringBase64BufferContents,
                    "base64"
                );

                this.view.setImageBytes(bytes);
            };
            reader.readAsDataURL(file);

            // Set image file extension (and move to a separate method)
            const fileExtension = this.getFileExtension(file);
            if (fileExtension) {
                this.view.setImageFileExtension(fileExtension);
            }
        } else {
            this.view.setImageUrl("");
            this.view.setImageBytes(new Uint8Array());
        }
    };

    public getFileExtension(file: File): string | undefined {
        return file.name.split(".").pop();
    }
}