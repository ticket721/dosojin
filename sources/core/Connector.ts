import { ActionEntity } from './ActionEntity';
import { Dosojin } from './Dosojin';
import { Gem } from './Gem';

export abstract class Connector<ConnectorInfo = any> extends ActionEntity {
    protected dosojin: Dosojin;

    protected constructor(name: string, dosojin: Dosojin) {
        super(name);
        this.dosojin = dosojin;
    }

    public abstract async getConnectorInfo(gem: Gem): Promise<ConnectorInfo>;
    public abstract async setReceptacleInfo(info: any): Promise<void>;
}
