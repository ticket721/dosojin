import BN                       from 'bn.js';
import {
    Connector,
    Gem,
    Dosojin,
    Operation,
    OperationStatusNames,
    Receptacle,
    TransferConnectorStatusNames,
    TransferReceptacleStatusNames,
}            from '../../core';

class GenericStripeDosojinReceptacle extends Receptacle {

    public connectorInfo: any = null;

    constructor(dosojin: Dosojin) {
        super('GenericStripeDosojinReceptacle', dosojin);
    }

    public async run(gem: Gem): Promise<Gem> {
        gem.setState(this.dosojin, {hello: 'lol'});
        return gem.setReceptacleStatus(TransferReceptacleStatusNames.TransferComplete);
    }

    public async dryRun(gem: Gem): Promise<Gem> {
        gem = gem.addCost(
            this.dosojin,
            {
                max: new BN(4),
                min: new BN(2),
            },
            'fiat_eur',
            'Money money eur',
        ).addCost(
            this.dosojin,
            {
                max: new BN(2),
                min: new BN(1),
            },
            'fiat_usd',
            'Money money usd',
        );

        return gem.setReceptacleStatus(TransferReceptacleStatusNames.TransferComplete);
    }

    public async scopes(gem: Gem): Promise<string[]> {
        return ['fiat_eur', 'fiat_usd'];
    }

    public async getReceptacleInfo(gem: Gem): Promise<any> {
        return {
            iban: 'an iban',
        };
    }

    public async setConnectorInfo(info: any): Promise<void> {
        this.connectorInfo = info;
    }
}

// tslint:disable-next-line:max-classes-per-file
class GenericStripeDosojinConnector extends Connector {

    public receptacleInfo: any = null;

    constructor(dosojin: Dosojin) {
        super('GenericStripeDosojinConnector', dosojin);
    }

    public async run(gem: Gem): Promise<Gem> {
        console.log('running connector');
        return gem.setConnectorStatus(TransferConnectorStatusNames.TransferComplete);
    }

    public async dryRun(gem: Gem): Promise<Gem> {
        gem = gem.addCost(
            this.dosojin,
            {

                max: new BN(4),
                min: new BN(2),
            },
            'fiat_eur',
            'Money money eur',
        ).addCost(
            this.dosojin,
            {
                max: new BN(2),
                min: new BN(1),
            },
            'fiat_usd',
            'Money money usd',
        );

        return gem.setConnectorStatus(TransferConnectorStatusNames.TransferComplete);
    }

    public async scopes(gem: Gem): Promise<string[]> {
        return ['fiat_eur', 'fiat_usd'];
    }

    public async getConnectorInfo(gem: Gem): Promise<any> {
        return {
            transfer_id: 'abcdefg',
        };
    }

    public async setReceptacleInfo(info: any): Promise<void> {
        console.log('in connector', info);
        this.receptacleInfo = info;
    }

}

// tslint:disable-next-line:max-classes-per-file
class GenericStripeDosojinOperation extends Operation {

    constructor(dosojin: Dosojin) {
        super('GenericStripeDosojinOperation', dosojin);
    }

    public async run(gem: Gem): Promise<Gem> {

        console.log(gem.getState(this.dosojin));
        gem
            .addCost(this.dosojin, new BN(1), 'fiat_eur', 'Because it needed money')
            .setPayloadValues({
                ...gem.gemPayload.values,
                fiat_eur: gem.gemPayload.values.fiat_eur.sub(new BN(1)),
            });

        return gem.setOperationStatus(OperationStatusNames.OperationComplete);
    }

    public async dryRun(gem: Gem): Promise<Gem> {
        gem = gem.addCost(
            this.dosojin,
            {
                max: new BN(4),
                min: new BN(2),
            },
            'fiat_eur',
            'Money money eur',
        ).addCost(
            this.dosojin,
            {
                max: new BN(2),
                min: new BN(1),
            },
            'fiat_usd',
            'Money money usd',
        );

        return gem.setOperationStatus(OperationStatusNames.OperationComplete);
    }

    public async scopes(gem: Gem): Promise<string[]> {
        return ['fiat_eur', 'fiat_usd'];
    }

}

// tslint:disable-next-line:max-classes-per-file
export class GenericStripeDosojinMock extends Dosojin {

    constructor(extra?: string) {
        super(extra ? `GenericStripeDosojinMock_${extra}` : 'GenericStripeDosojinMock');
        this.addConnector(new GenericStripeDosojinConnector(this));
        this.addReceptacle(new GenericStripeDosojinReceptacle(this));
        this.addOperation(new GenericStripeDosojinOperation(this));
    }

}
