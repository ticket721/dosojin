import { Dosojin }    from './Dosojin';
import { LayerError } from './errors';
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

    public async runOperation(gem: Gem, dry: boolean): Promise<Gem> {
        if (gem.operationStatus) {

            if (gem.operationStatus.layer !== this.index) {
                throw new LayerError(this.index, `received Gem with invalid index: got ${gem.operationStatus.layer}, expected ${this.index}`);
            }

            return this.dosojin.run(gem, dry);

        } else {
            throw new LayerError(this.index, `received Gem with null operationStatus`);
        }

    }

    public async runTransfer(gem: Gem, dry: boolean): Promise<Gem> {
        if (gem.transferStatus) {
            if (gem.transferStatus.connector && gem.transferStatus.connector.layer === this.index) {
                return this.dosojin.run(gem, dry);
            } else if (gem.transferStatus.receptacle && gem.transferStatus.receptacle.layer === this.index) {
                return this.dosojin.run(gem, dry);
            } else {
                throw new LayerError(this.index, `received Gem with 'transfer' action type, but no Connector or Receptacle for ${this.name} layer`);
            }
        } else {
            throw new LayerError(this.index, `received Gem with null transferStatus`);
        }
    }

    public async setReceptacleInfo<ReceptacleInfo = any>(gem: Gem, receptacleInfo: ReceptacleInfo): Promise<void> {
        if (this.dosojin === null) {
            throw new LayerError(this.index, `no Dosojin in Layer ${this.name}`);
        }

        switch (gem.actionType) {
            case 'transfer': {
                try {
                    return await this.dosojin.setReceptacleInfo<ReceptacleInfo>(gem, receptacleInfo);
                } catch (e) {
                    throw new LayerError(this.index, e);
                }
            }

            default: {
                throw new LayerError(this.index, `received Gem with invalid actionType ${gem.actionType} while setting Receptacle info`);
            }
        }
    }

    public async getConnectorInfo(gem: Gem): Promise<Gem> {
        if (this.dosojin === null) {
            throw new LayerError(this.index, `no Dosojin in Layer ${this.name}`);
        }

        switch (gem.actionType) {
            case 'transfer': {
                try {
                    return this.dosojin.getConnectorInfo(gem);
                } catch (e) {
                    throw new LayerError(this.index, e);
                }
            }

            default: {
                throw new LayerError(this.index, `received Gem with invalid actionType ${gem.actionType} while getting Connector info`);
            }
        }
    }

    public async setConnectorInfo<ConnectorInfo>(gem: Gem, connectorInfo: ConnectorInfo): Promise<void> {
        if (this.dosojin === null) {
            throw new LayerError(this.index, `no Dosojin in Layer ${this.name}`);
        }

        switch (gem.actionType) {
            case 'transfer': {
                try {
                    return await this.dosojin.setConnectorInfo<ConnectorInfo>(gem, connectorInfo);
                } catch (e) {
                    throw new LayerError(this.index, e);
                }
            }

            default: {
                throw new LayerError(this.index, `received Gem with invalid actionType ${gem.actionType} while setting Connector info`);
            }
        }
    }

    public async getReceptacleInfo(gem: Gem): Promise<Gem> {
        if (this.dosojin === null) {
            throw new LayerError(this.index, `no Dosojin in Layer ${this.name}`);
        }

        switch (gem.actionType) {
            case 'transfer': {
                try {
                    return this.dosojin.getReceptacleInfo(gem);
                } catch (e) {
                    throw new LayerError(this.index, e);
                }
            }

            default: {
                throw new LayerError(this.index, `received Gem with invalid actionType ${gem.actionType} while getting Receptacle info`);
            }
        }
    }

    public async run(gem: Gem, dry: boolean): Promise<Gem> {
        if (this.dosojin === null) {
            throw new LayerError(this.index, `no Dosojin in Layer ${this.name}`);
        }

        switch (gem.actionType) {
            case 'operation': {
                try {
                    return await this.runOperation(gem, dry);
                } catch (e) {
                    throw new LayerError(this.index, e);
                }
            }

            case 'transfer': {
                try {
                    return await this.runTransfer(gem, dry);
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

        return (await this.dosojin.selectOperations(gem)).setOperationsLayer(this.index);
    }

    public setRegistry(add: (name: string) => void, rm: (name: string) => void): void {
        this.add = add;
        this.rm = rm;
    }

}
