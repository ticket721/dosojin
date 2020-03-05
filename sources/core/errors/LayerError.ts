import { DosojinError } from './DosojinError';

export class LayerError extends DosojinError {
    public readonly layer: number;

    constructor(layer: number, err: DosojinError | string, errType: string = 'LayerError') {
        switch (typeof err) {
            case 'object': {
                super(err.dosojin, err, errType);
                break;
            }
            case 'string': {
                super(null, err);
                this.name = 'LayerError';
                break;
            }
        }
        this.layer = layer;
    }
}
