

export interface View {
    displayErrorMessage: (message: string) => void;
}

export abstract class Presenter<V extends View> {
    private _view: V;
    protected constructor(view: V) {
        this._view = view;
    }
    public get view() {
        return this._view;
    }

    protected async doFailureReportingOperation(operation: () => Promise<void>, operationDescription: string) {
        try {
            await operation();
        } catch (error) {
            this._view.displayErrorMessage(
                `Failed to ${operationDescription} because of exception: ${error}`,
            );
        }
    };
}