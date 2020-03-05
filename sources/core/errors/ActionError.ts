export class ActionError extends Error {
    public readonly action: string;

    constructor(actionName: string, err: Error | string, errType?: string) {
        switch (typeof err) {
            case 'object': {
                super(err.message);
                this.name = errType;
                this.stack = `${this.stack}\n ==>> ${err.stack}`;
                break;
            }
            case 'string': {
                super(err);
                this.name = 'ActionError';
                break;
            }
        }
        this.action = actionName;
    }
}
