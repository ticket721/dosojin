import { Dosojin }    from './Dosojin';
import { LayerError } from './errors/LayerError';
import { Gem }        from './Gem';
import { Layer }      from './Layer';

export class SingleDosojinLayer extends Layer {

    private dosojin: Dosojin = null;
    private add: (name: string) => void;
    private rm: (name: string) => void;

    public setDosojin(dosojin: Dosojin): void {
        if (this.dosojin !== null) {
            this.rm(this.dosojin.name);
        }
        this.dosojin = dosojin;
        this.add(this.dosojin.name);
    }

    public async runOperation(gem: Gem): Promise<Gem> {
        if (gem.operationStatus) {

            if (gem.operationStatus.layer !== this.index) {
                throw new LayerError(this.index, `received Gem with invalid index: got ${gem.operationStatus.layer}, expected ${this.index}`);
            }

            return this.dosojin.run(gem);

        } else {
            throw new LayerError(this.index, `received Gem with null operationStatus`);
        }

    }

    public async runTransfer(gem: Gem): Promise<Gem> {
        if (gem.transferStatus) {
            if (gem.transferStatus.connector && gem.transferStatus.connector.layer === this.index) {
                return this.dosojin.run(gem);
            } else if (gem.transferStatus.receptacle && gem.transferStatus.receptacle.layer === this.index) {
                return this.dosojin.run(gem);
            } else {
                throw new LayerError(this.index, `received Gem with 'transfer' action type, but no Connector or Receptacle for ${this.name} layer`);
            }
        } else {
            throw new LayerError(this.index, `received Gem with null transferStatus`);
        }
    }

    public async run(gem: Gem): Promise<Gem> {
        if (this.dosojin === null) {
            throw new LayerError(this.index, `no Dosojin in Layer ${this.name}`);
        }

        switch (gem.actionType) {
            case 'operation': {
                try {
                    return await this.runOperation(gem);
                } catch (e) {
                    throw new LayerError(this.index, e);
                }
            }

            case 'transfer': {
                try {
                    return await this.runTransfer(gem);
                } catch (e) {
                    throw new LayerError(this.index, e);
                }
            }

            default: {
                throw new LayerError(this.index, `received Gem with invalid actionType ${gem.actionType}`);
            }
        }
    }

    public async selectReceptacle(gem: Gem): Promise<Gem> {
        if (this.dosojin === null) {
            throw new LayerError(this.index, `no Dosojin in Layer ${this.name}`);
        }

        return (await this.dosojin.selectReceptacle(gem)).setReceptacleLayer(this.index);
    }

    public async selectConnector(gem: Gem): Promise<Gem> {

        if (this.dosojin === null) {
            throw new LayerError(this.index, `no Dosojin in Layer ${this.name}`);
        }

        return (await this.dosojin.selectConnector(gem)).setConnectorLayer(this.index);

    }

    public async selectOperations(gem: Gem): Promise<Gem> {

        if (this.dosojin === null) {
            throw new LayerError(this.index, `no Dosojin in Layer ${this.name}`);
        }

        return (await this.dosojin.selectOperations(gem)).setOperationLayer(this.index);
    }

    public setRegistry(add: (name: string) => void, rm: (name: string) => void): void {
        this.add = add;
        this.rm = rm;
    }

}
