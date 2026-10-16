import {Service} from "../model.service/Service";

// parent presenter for logout and post
export abstract class PLParent<T extends Service> {
    protected _service: T;

    public constructor() {
        this._service = this.serviceFactory();
    }

    protected abstract serviceFactory(): T;
}