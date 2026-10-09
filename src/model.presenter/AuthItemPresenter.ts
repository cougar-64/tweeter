

export interface AuthItemView {
    // inputFieldFactory: () => void;
    // switchAuthenticationMethoFactory: () => void;
    displayErrorMessage: (message: string) => void;
}

export abstract class AuthItemPresenter {
    private _alias: string | null = null;
    protected _password: string | null = null;
    protected _firstName: string | null = null;
    protected _lastName: string | null = null;
    protected _userImageBytes: Uint8Array | null = null;
    protected _imageFileExtension: string | null = null;
    protected view: AuthItemView;
    protected _isLoading: boolean = false;
    protected constructor(view: AuthItemView)
    {
        this.view = view;
    }

    public abstract getIn(alias: string, password: string): void;
    public abstract doGetIn(rememberMe: boolean, originalUrl: string | undefined): void;

    public set alias(value: string | null) {
        this._alias = value;
    }

    public get alias() {
        return this._alias;
    }

    public set password(value: string | null) {
        this._password = value;
    }

    public get password() {
        return this._password;
    }

    public set firstName(value: string | null) {
        this._firstName = value;
    }

    public get firstName() {
        return this._firstName;
    }

    public set lastName(value: string | null) {
        this._lastName = value;
    }

    public get lastName() {
        return this._lastName;
    }

    public set userItemBytes(value: Uint8Array | null) {
        this._userImageBytes = value;
    }

    public get userItemBytes() {
        return this._userImageBytes;
    }

    public set imageFileExtension(value: string | null) {
        this._imageFileExtension = value;
    }

    public get imageFileExtension() {
        return this._imageFileExtension
    }

    public set isLoading(value: boolean) {
        this._isLoading = value;
    }

    public get isLoading() {
        return this._isLoading;
    }
}

