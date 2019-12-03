import { Gem }                                                         from './Gem';
import { Layer }                                                       from './Layer';
import { OperationStatusNames }                                        from './OperationStatus';
import { TransferConnectorStatusNames, TransferReceptacleStatusNames } from './TransferStatus';

export class Circuit {

    private layers: Layer[] = [];

    constructor(initialLayers?: Layer[]) {
        if (initialLayers) {
            for (const layer of initialLayers) {
                this.pushLayer(layer);
            }
        }
    }

    public async createGem(): Promise<Gem> {

        if (!this.layers.length) {
            throw new Error(`Cannot create Gem in empty circuit`);
        }

        const gem = new Gem();

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
                throw new Error(`Received Gem with invalid operation layer index ${gem.operationStatus.layer} (max ${this.layers.length})`);
            }
        } else {
            throw new Error(`Received Gem with null operationStatus`);
        }
    }

    public async runTransfer(gem: Gem): Promise<Gem> {
        if (gem.transferStatus) {

            if (!gem.transferStatus.receptacle && !gem.transferStatus.connector) {
                throw new Error(`Received Gem 'transfer' action type, but no connector or receptacle found`);
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
                    return gem.error();
                }
            }

            if (gem.transferStatus.connector) {
                if (gem.transferStatus.connector.layer < this.layers.length) {
                    gem = await this.layers[gem.transferStatus.connector.layer].run(gem);
                } else {
                    throw new Error(`Received Gem with invalid connector layer index ${gem.transferStatus.connector.layer} (max ${this.layers.length})`);
                }
            }

            if (gem.transferStatus.receptacle) {
                if (gem.transferStatus.receptacle.layer < this.layers.length) {
                    gem = await this.layers[gem.transferStatus.receptacle.layer].run(gem);
                } else {
                    throw new Error(`Received Gem with invalid receptacle layer index ${gem.transferStatus.receptacle.layer} (max ${this.layers.length})`);
                }

            }


            return gem;

        } else {
            throw new Error(`Received Gem with null transferStatus`);
        }
    }

    public async run(gem: Gem): Promise<Gem> {
        switch (gem.actionType) {
            case 'operation': return this.runOperation(gem);
            case 'transfer': return this.runTransfer(gem);
            default: {
                throw new Error(`Received Gem with invalid actionType ${gem.actionType}`);
            }
        }
    }

    public pushLayer(layer: Layer): void {
        layer.setIndex(this.layers.length);
        this.layers.push(layer);
    }

}
