import {Service} from "../model.service/Service";
import {Presenter, View} from "./Presenter";

export interface PLPView extends View {
    displayInfoMessage: (message: string, duration: number, bootstrapClasses?: string | undefined) => string;
    displayErrorMessage: (message: string) => void;
    deleteMessage: (message: string) => void;
}

// parent presenter for logout and post
export abstract class PLParent<V extends PLPView, T extends Service> extends Presenter<V>{
    protected _service: T;

    public constructor(view: V) {
        super(view);
        this._service = this.serviceFactory();
    }

    protected abstract serviceFactory(): T;
}