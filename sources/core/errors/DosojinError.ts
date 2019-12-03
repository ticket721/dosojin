import { ActionError } from './ActionError';

export class DosojinError extends ActionError {

    public readonly dosojin: string;

    constructor(dosojin: string, err: ActionError | string, errType: string = 'DosojinError') {
        switch (typeof err) {
            case 'object': {
                super(err.action, err, errType);
                break ;
            }
            case 'string': {
                super(null, err);
                this.name = 'DosojinError';
                break ;
            }
        }
        this.dosojin = dosojin;
    }
}
