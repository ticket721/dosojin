import { ActionEntity } from './ActionEntity';
import { Dosojin }      from './Dosojin';

export abstract class Connector extends ActionEntity {
    protected dosojin: Dosojin;

    protected constructor(name: string, dosojin: Dosojin) {
        super(name);
        this.dosojin = dosojin;
    }

}
