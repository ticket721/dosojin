import { Connector }            from '../../core/Connector';
import { Dosojin }              from '../../core/Dosojin';
import { Gem }                  from '../../core/Gem';
import { Operation }            from '../../core/Operation';
import { OperationStatusNames } from '../../core/OperationStatus';
import { Receptacle }           from '../../core/Receptacle';
import { ScopeValues }          from '../../core/Scope';
import {
    TransferConnectorStatusNames,
    TransferReceptacleStatusNames,
}                               from '../../core/TransferStatus';


class BasicDosojinReceptacle extends Receptacle {

    constructor() {
        super('BasicDosojinReceptacle');
    }

    public async run(gem: Gem): Promise<Gem> {
        return gem.setReceptacleStatus(TransferReceptacleStatusNames.TransferComplete);
    }

    public async cost(gem: Gem): Promise<ScopeValues> {
        return {
            'sepaeur': 10
        };
    }

}

// tslint:disable-next-line:max-classes-per-file
class BasicDosojinConnector extends Connector {

    constructor() {
        super('BasicDosojinConnector');
    }

    public async run(gem: Gem): Promise<Gem> {
        return gem.setConnectorStatus(TransferConnectorStatusNames.TransferComplete);
    }

    public async cost(gem: Gem): Promise<ScopeValues> {
        return {
            'sepaeur': 5
        };
    }
}

// tslint:disable-next-line:max-classes-per-file
class BasicDosojinOperation extends Operation {

    constructor() {
        super('BasicDosojinOperation');
    }

    public async run(gem: Gem): Promise<Gem> {
        return gem.setOperationStatus(OperationStatusNames.OperationComplete);
    }

    public async cost(gem: Gem): Promise<ScopeValues> {
        return {
            'sepaeur': 7
        };
    }
}

// tslint:disable-next-line:max-classes-per-file
export class BasicDosojinMock extends Dosojin {

    constructor(extra?: string) {
        super(extra ? `BasicDosojinMock_${extra}` : "BasicDosojinMock");
        this.addConnector(new BasicDosojinConnector());
        this.addReceptacle(new BasicDosojinReceptacle());
        this.addOperation(new BasicDosojinOperation());
    }

}
