import { Connector }  from './Connector';
import { Dosojin }    from './Dosojin';
import { Gem }        from './Gem';
import { Layer }      from './Layer';
import { Receptacle } from './Receptacle';

export class SingleDosojinLayer extends Layer {

    private dosojin: Dosojin = null;

    public setDosojin(dosojin: Dosojin): void {
        this.dosojin = dosojin;
    }

    public async runOperation(gem: Gem): Promise<Gem> {
        if (gem.operationStatus) {

            if (gem.operationStatus.layer !== this.index) {
                throw new Error(`Received Gem with invalid index: got ${gem.operationStatus.layer}, expected ${this.index}`);
            }

            return this.dosojin.run(gem);

        } else {
            throw new Error(`Received Gem with null operationStatus`);
        }

    }

    public async runTransfer(gem: Gem): Promise<Gem> {
        if (gem.transferStatus) {
            if (gem.transferStatus.connector && gem.transferStatus.connector.layer === this.index) {
                return this.dosojin.run(gem);
            } else if (gem.transferStatus.receptacle && gem.transferStatus.receptacle.layer === this.index) {
                return this.dosojin.run(gem);
            } else {
                throw new Error(`Received Gem 'transfer' action type, but no connector or receptacle for ${this.name} layer`);
            }
        } else {
            throw new Error(`Received Gem with null transferStatus`);
        }
    }

    public async run(gem: Gem): Promise<Gem> {
        if (this.dosojin === null) {
            throw new Error(`No dosojin in layer ${this.name}`);
        }

        switch (gem.actionType) {
            case 'operation': return this.runOperation(gem);

            case 'transfer': return this.runTransfer(gem);

            default: {
                throw new Error(`Received Gem with invalid actionType ${gem.actionType}`);
            }
        }
    }

    public async selectReceptacle(gem: Gem): Promise<Gem> {
        if (this.dosojin === null) {
            throw new Error(`No dosojin in layer ${this.name}`);
        }

        return (await this.dosojin.selectReceptacle(gem)).setReceptacleLayer(this.index);
    }

    public async selectConnector(gem: Gem): Promise<Gem> {

        if (this.dosojin === null) {
            throw new Error(`No dosojin in layer ${this.name}`);
        }

        return (await this.dosojin.selectConnector(gem)).setConnectorLayer(this.index);

    }

    public async selectOperations(gem: Gem): Promise<Gem> {

        if (this.dosojin === null) {
            throw new Error(`No dosojin in layer ${this.name}`);
        }

        return (await this.dosojin.selectOperations(gem)).setOperationLayer(this.index);
    }

}
