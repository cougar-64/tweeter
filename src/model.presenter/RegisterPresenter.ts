import {Buffer} from "buffer";
import {AuthPresenter, AuthView} from "./AuthPresenter";
import { User, AuthToken } from "tweeter-shared";


export interface RegisterView extends AuthView {

}

export class RegisterPresenter extends AuthPresenter {

    public doGetIn(alias: string, password: string, rememberMe: boolean, firstName?: string | undefined, lastName?: string | undefined, originalUrl?: string | undefined, userImageBytes?: Uint8Array | undefined, imageFileExtension?: string | undefined): Promise<[User, AuthToken]> {
        return this._userService!.register(
            firstName!, lastName!, alias, password, userImageBytes!, imageFileExtension!,
        );
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

    public itemDescription(): string {
        return "register";
    }
}