import { LayerError } from './LayerError';

export class CircuitError extends LayerError {

    public readonly circuit: string;

    constructor(circuit: string, err: LayerError | string) {
        switch (typeof err) {
            case 'object': {
                super(err.layer, err, 'CircuitError');
                break ;
            }
            case 'string': {
                super(null, err);
                this.name = 'CircuitError';
                break ;
            }
        }
        this.circuit = circuit;
    }
}
