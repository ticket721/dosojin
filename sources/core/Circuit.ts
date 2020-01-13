import { CircuitError }                                                from './errors';
import { Gem }                                                         from './Gem';
import { Layer }                                                       from './Layer';
import { OperationStatusNames }                                        from './OperationStatus';
// import { ScopedValues }                                                 from './Scope';
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

    public async createGem<DosojinState = any>(initialGem: Gem = new Gem({}), initialArguments: DosojinState = null): Promise<Gem> {
        if (!this.layers.length) {
            throw new CircuitError(this.name, `cannot create Gem in empty Circuit`);
        }

        initialGem.setReceptacleStatus(TransferReceptacleStatusNames.ReadyForTransfer);
        initialGem = await this.layers[0].selectReceptacle(initialGem);

        if (!initialGem.transferStatus.receptacle.dosojin) {
            throw new CircuitError(this.name, `no Receptacle found after initial Gem setup`);
        }

        initialGem.setState<DosojinState>(initialGem.transferStatus.receptacle.dosojin, initialArguments);

        return initialGem;
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
                throw new CircuitError(this.name, `received Gem with invalid Operation Layer index ${gem.operationStatus.layer} (max ${this.layers.length - 1})`);
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
                    return gem.missingReceptacle();
                }
            }

            let receptacleInfo: any = {__end: true};
            let connectorInfo: any = {__begin: true};

            if (gem.transferStatus.receptacle) {
                if (gem.transferStatus.receptacle.layer < this.layers.length) {
                    receptacleInfo = await this.layers[gem.transferStatus.receptacle.layer].getReceptacleInfo(gem);
                } else {
                    throw new CircuitError(this.name, `received Gem with invalid Receptacle Layer index ${gem.transferStatus.receptacle.layer} (max ${this.layers.length - 1})`);
                }
            }

            if (gem.transferStatus.connector) {
                if (gem.transferStatus.connector.layer < this.layers.length) {
                    await this.layers[gem.transferStatus.connector.layer].setReceptacleInfo(gem, receptacleInfo);
                    gem = await this.layers[gem.transferStatus.connector.layer].run(gem);
                    connectorInfo = await this.layers[gem.transferStatus.connector.layer].getConnectorInfo(gem);
                } else {
                    throw new CircuitError(this.name, `received Gem with invalid Connector Layer index ${gem.transferStatus.connector.layer} (max ${this.layers.length - 1})`);
                }
            }

            if (gem.transferStatus.receptacle) {
                await this.layers[gem.transferStatus.receptacle.layer].setConnectorInfo(gem, connectorInfo);
                gem = await this.layers[gem.transferStatus.receptacle.layer].run(gem);
            }

            return gem;

        } else {
            throw new CircuitError(this.name, `received Gem with null transferStatus`);
        }
    }

    public async dryRunOperation(gem: Gem): Promise<Gem> {
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

                return this.layers[gem.operationStatus.layer].dryRun(gem);

            } else {
                throw new CircuitError(this.name, `received Gem with invalid Operation Layer index ${gem.operationStatus.layer} (max ${this.layers.length - 1})`);
            }
        } else {
            throw new CircuitError(this.name, `received Gem with null operationStatus`);
        }
    }

    public async dryRunTransfer(gem: Gem): Promise<Gem> {
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

            let receptacleInfo: any = {__end: true};
            let connectorInfo: any = {__begin: true};

            if (gem.transferStatus.receptacle) {
                if (gem.transferStatus.receptacle.layer < this.layers.length) {
                    receptacleInfo = await this.layers[gem.transferStatus.receptacle.layer].getReceptacleInfo(gem);
                } else {
                    throw new CircuitError(this.name, `received Gem with invalid Receptacle Layer index ${gem.transferStatus.receptacle.layer} (max ${this.layers.length - 1})`);
                }
            }

            if (gem.transferStatus.connector) {
                if (gem.transferStatus.connector.layer < this.layers.length) {
                    await this.layers[gem.transferStatus.connector.layer].setReceptacleInfo(gem, receptacleInfo);
                    gem = await this.layers[gem.transferStatus.connector.layer].dryRun(gem);
                    connectorInfo = await this.layers[gem.transferStatus.connector.layer].getConnectorInfo(gem);
                } else {
                    throw new CircuitError(this.name, `received Gem with invalid Connector Layer index ${gem.transferStatus.connector.layer} (max ${this.layers.length - 1})`);
                }
            }

            if (gem.transferStatus.receptacle) {
                await this.layers[gem.transferStatus.receptacle.layer].setConnectorInfo(gem, connectorInfo);
                gem = await this.layers[gem.transferStatus.receptacle.layer].dryRun(gem);
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

    public async dryRunEntitySelection(gem: Gem): Promise<Gem> {
        switch (gem.actionType) {
            case 'operation': {
                try {
                    return await this.dryRunOperation(gem);
                } catch (e) {
                    throw new CircuitError(this.name, e);
                }
            }
            case 'transfer': {
                try {
                    return await this.dryRunTransfer(gem);
                } catch (e) {
                    throw new CircuitError(this.name, e);
                }
            }
            default: {
                throw new CircuitError(this.name, `received Gem with invalid actionType ${gem.actionType}`);
            }
        }
    }

    public async dryRun(gem: Gem): Promise<Gem> {
        while (['Complete', 'Error', 'Fatal'].indexOf(gem.gemStatus) === -1) {
            gem = await this.dryRunEntitySelection(gem);    
        }

        return gem;
    }

    public pushLayer(layer: Layer): void {
        layer.setIndex(this.layers.length);
        layer.setRegistry(this.registerDosojin.bind(this), this.clearDosojin.bind(this));
        this.layers.push(layer);
    }

    public getRegistry(): {[key: string]: boolean} {
        return this.registry;
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
