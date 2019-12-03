import BN                       from 'bn.js';
import { Connector }            from '../../core/Connector';
import { Dosojin }              from '../../core/Dosojin';
import { ActionError }          from '../../core/errors/ActionError';
import { Gem }                  from '../../core/Gem';
import { Operation }            from '../../core/Operation';
import { OperationStatusNames } from '../../core/OperationStatus';
import { Receptacle }           from '../../core/Receptacle';
import { ScopedValues }         from '../../core/Scope';
import {
    TransferConnectorStatusNames,
    TransferReceptacleStatusNames,
}                               from '../../core/TransferStatus';


class BasicDosojinReceptacle extends Receptacle {

    constructor(dosojin: Dosojin) {
        super('BasicDosojinReceptacle', dosojin);
    }

    public async run(gem: Gem): Promise<Gem> {
        return gem.setReceptacleStatus(TransferReceptacleStatusNames.TransferComplete);
    }

    public async cost(gem: Gem): Promise<ScopedValues> {
        return {
            fiat_euro: new BN(1)
        };
    }

    public async scopes(gem: Gem): Promise<string[]> {
        return ['fiat_euro', 'fiat_usd'];
    }

}

// tslint:disable-next-line:max-classes-per-file
class BasicDosojinConnector extends Connector {

    constructor(dosojin: Dosojin) {
        super('BasicDosojinConnector', dosojin);
    }

    public async run(gem: Gem): Promise<Gem> {
        return gem.setConnectorStatus(TransferConnectorStatusNames.TransferComplete);
    }

    public async cost(gem: Gem): Promise<ScopedValues> {
        return {
            fiat_euro: new BN(1)
        };
    }

    public async scopes(gem: Gem): Promise<string[]> {
        return ['fiat_euro', 'fiat_usd'];
    }

}

// tslint:disable-next-line:max-classes-per-file
class BasicDosojinOperation extends Operation {

    constructor(dosojin: Dosojin) {
        super('BasicDosojinOperation', dosojin);
    }

    public async run(gem: Gem): Promise<Gem> {

        gem
            .addCost(this.dosojin, new BN(1), 'fiat_euro', 'Because it needed money')
            .setPayloadValues({
                ...gem.gemPayload.values,
                fiat_euro: gem.gemPayload.values.fiat_euro.sub(new BN(1))
            });

        return gem.setOperationStatus(OperationStatusNames.OperationComplete);
    }

    public async cost(gem: Gem): Promise<ScopedValues> {
        return {
            fiat_euro: new BN(1)
        };
    }

    public async scopes(gem: Gem): Promise<string[]> {
        return ['fiat_euro', 'fiat_usd'];
    }

}

// tslint:disable-next-line:max-classes-per-file
export class BasicDosojinMock extends Dosojin {

    constructor(extra?: string) {
        super(extra ? `BasicDosojinMock_${extra}` : 'BasicDosojinMock');
        this.addConnector(new BasicDosojinConnector(this));
        this.addReceptacle(new BasicDosojinReceptacle(this));
        this.addOperation(new BasicDosojinOperation(this));
    }

}
