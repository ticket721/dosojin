import { ActionEntity } from './ActionEntity';
import { Dosojin }      from './Dosojin';
import { Gem }          from './Gem';

export abstract class Receptacle<ReceptacleInfo = any> extends ActionEntity {
    protected dosojin: Dosojin;

    protected constructor(name: string, dosojin: Dosojin) {
        super(name);
        this.dosojin = dosojin;
    }

    public abstract async getReceptacleInfo(gem: Gem): Promise<ReceptacleInfo>;
    public abstract async setConnectorInfo(info: any): Promise<void>;

}
