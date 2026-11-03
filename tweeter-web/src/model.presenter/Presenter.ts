

export interface View {
    displayErrorMessage: (message: string) => void;
}

export abstract class Presenter<V extends View> {
    protected _view: V;
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

    // Generics take a generic type and allow the subclasses to pass in the type they'd like.
    // It helps remove duplicate code by just allowing the subclasses to pass in the type. All the logic is the same
    // in these two classes.
}