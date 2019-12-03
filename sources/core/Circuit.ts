import { CircuitError }                                                from './errors/CircuitError';
import { Gem }                                                         from './Gem';
import { Layer }                                                       from './Layer';
import { OperationStatusNames }                                        from './OperationStatus';
import { ScopedValues }                                                from './Scope';
import { TransferConnectorStatusNames, TransferReceptacleStatusNames } from './TransferStatus';

export class Circuit {

    private layers: Layer[] = [];
    private registry: {[key: string]: boolean} = {};
    private readonly name: string;

    constructor(name: string, initialLayers?: Layer[]) {
        this.name = name;
        if (initialLayers) {
            for (const layer of initialLayers) {
                this.pushLayer(layer);
            }
        }
    }

    public async createGem(initialValue: ScopedValues = {}): Promise<Gem> {

        if (!this.layers.length) {
            throw new CircuitError(this.name, `cannot create Gem in empty Circuit`);
        }

        const gem = new Gem(initialValue);

        gem.setReceptacleStatus(TransferReceptacleStatusNames.ReadyForTransfer);
        return this.layers[0].selectReceptacle(gem);

    }

    public async runOperation(gem: Gem): Promise<Gem> {
        if (gem.operationStatus) {
            if (gem.operationStatus.layer < this.layers.length) {

                if (gem.operationStatus.status === OperationStatusNames.OperationComplete) {
                    const layer = gem.operationStatus.layer;

                    gem.nextOperation();

                    if (gem.actionType === 'transfer') {
                        gem = await this.layers[layer].selectConnector(gem);
                        gem.setConnectorStatus(TransferConnectorStatusNames.ReadyForTransfer);

                        if (layer + 1 < this.layers.length) {
                            gem = await this.layers[layer + 1].selectReceptacle(gem);
                            gem.setReceptacleStatus(TransferReceptacleStatusNames.ReadyForTransfer);
                        }

                    }

                    return gem;
                }

                return this.layers[gem.operationStatus.layer].run(gem);

            } else {
                throw new CircuitError(this.name, `received Gem with invalid Operation Layer index ${gem.operationStatus.layer} (max ${this.layers.length})`);
            }
        } else {
            throw new CircuitError(this.name, `received Gem with null operationStatus`);
        }
    }

    public async runTransfer(gem: Gem): Promise<Gem> {
        if (gem.transferStatus) {

            if (!gem.transferStatus.receptacle && !gem.transferStatus.connector) {
                throw new CircuitError(this.name, `received Gem with 'transfer' action type, but no Connector or Receptacle found`);
            }

            if (
                ((gem.transferStatus.connector && gem.transferStatus.connector.status === TransferConnectorStatusNames.TransferComplete) || !gem.transferStatus.connector)
                && ((gem.transferStatus.receptacle && gem.transferStatus.receptacle.status === TransferReceptacleStatusNames.TransferComplete))
            ) {

                const layer = gem.transferStatus.receptacle.layer;
                gem.setActionType('operation');
                return (await this.layers[layer].selectOperations(gem)).setOperationStatus(OperationStatusNames.ReadyForOperation);

            }

            if (
                ((gem.transferStatus.connector && gem.transferStatus.connector.status === TransferConnectorStatusNames.TransferComplete)
                    && (!gem.transferStatus.receptacle))
            ) {
                if (gem.transferStatus.connector.layer === this.layers.length - 1) {
                    return gem.setGemStatus('Complete');
                } else {
                    return gem.missingReceptacle()
                }
            }

            if (gem.transferStatus.connector) {
                if (gem.transferStatus.connector.layer < this.layers.length) {
                    gem = await this.layers[gem.transferStatus.connector.layer].run(gem);
                } else {
                    throw new CircuitError(this.name, `received Gem with invalid Connector Layer index ${gem.transferStatus.connector.layer} (max ${this.layers.length})`);
                }
            }

            if (gem.transferStatus.receptacle) {
                if (gem.transferStatus.receptacle.layer < this.layers.length) {
                    gem = await this.layers[gem.transferStatus.receptacle.layer].run(gem);
                } else {
                    throw new CircuitError(this.name, `received Gem with invalid Receptacle Layer index ${gem.transferStatus.receptacle.layer} (max ${this.layers.length})`);
                }

            }

            return gem;

        } else {
            throw new CircuitError(this.name, `received Gem with null transferStatus`);
        }
    }

    public async run(gem: Gem): Promise<Gem> {
        switch (gem.actionType) {
            case 'operation': {
                try {
                    return await this.runOperation(gem);
                } catch (e) {
                    throw new CircuitError(this.name, e);
                }
            }
            case 'transfer': {
                try {
                    return await this.runTransfer(gem);
                } catch (e) {
                    throw new CircuitError(this.name, e);
                }
            }
            default: {
                throw new CircuitError(this.name, `received Gem with invalid actionType ${gem.actionType}`);
            }
        }
    }

    public pushLayer(layer: Layer): void {
        layer.setIndex(this.layers.length);
        layer.setRegistry(this.registerDosojin.bind(this), this.clearDosojin.bind(this));
        this.layers.push(layer);
    }

    private registerDosojin(name: string): void {
        if (this.registry[name]) {
            throw new CircuitError(this.name, `Dosojin with name ${name} already registered by Circuit ${this.name}`);
        }
        this.registry[name] = true;
    }

    private clearDosojin(name: string): void {
        if (!this.registry[name]) {
            throw new CircuitError(this.name, `Dosojin with name ${name} not registered by Circuit ${this.name}`);
        }
        this.registry[name] = false;
    }

}
