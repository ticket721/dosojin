import { Connector }                                                                          from './Connector';
import { Gem }                                                                                from './Gem';
import { Operation }                                                                          from './Operation';
import { Receptacle }                                                                         from './Receptacle';

export class Dosojin {

    public connectors: Connector[] = [];
    public receptacles: Receptacle[] = [];
    public operations: Operation[] = [];
    public name: string;

    constructor(name: string) {
        this.name = name;
    }

    public async runTransfer(gem: Gem): Promise<Gem> {

        if (gem.transferStatus) {

            if (gem.transferStatus.connector && gem.transferStatus.connector.dosojin === this.name) {

                const connectorIndex = this.connectors.findIndex((co: Connector) => co.name === gem.transferStatus.connector.name);

                if (connectorIndex === -1) {
                    throw new Error(`Unkown connector ${gem.transferStatus.connector.name} in dosojin ${this.name}`);
                }

                const connector: Connector = this.connectors[connectorIndex];

                return connector.run(gem);

            } else if (gem.transferStatus.receptacle && gem.transferStatus.receptacle.dosojin === this.name) {
                const receptacleIndex = this.receptacles.findIndex((re: Receptacle) => re.name === gem.transferStatus.receptacle.name);

                if (receptacleIndex === -1) {
                    throw new Error(`Unkown receptacle ${gem.transferStatus.receptacle.name} in dosojin ${this.name}`);
                }

                const receptacle: Receptacle = this.receptacles[receptacleIndex];

                return receptacle.run(gem);

            } else {
                throw new Error(`Received Gem 'transfer' action type, but no connector or receptacle for ${this.name} dosojin`);
            }

        } else {
            throw new Error(`Received Gem with null transferStatus while on 'transfer' actionType`);
        }

    }

    public async runOperation(gem: Gem): Promise<Gem> {

        if (gem.operationStatus) {

            if (gem.operationStatus.dosojin !== this.name) {
                throw new Error(`Received invalid gem with invalid dosojin name: expected ${this.name}, got ${gem.operationStatus.dosojin}`)
            }

            if (gem.operationStatus.operation_list.length === 0) {
                throw new Error(`Received invalid gem with no operations left.`)
            }

            const operationIndex: number = this.operations.findIndex((op: Operation) => op.name === gem.operationStatus.operation_list[0]);

            if (operationIndex === -1) {
                throw new Error(`Unknown operation ${gem.operationStatus.operation_list[0]} in dosojin ${this.name}`);
            }

            const operation: Operation = this.operations[operationIndex];

            return operation.run(gem);

        } else {
            throw new Error(`Received Gem with null operationStatus while on 'operation' actionType`);
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

    public async selectReceptacle(gem: Gem): Promise<Gem> {

        if (this.receptacles.length === 0) {
            throw new Error(`Trying to select receptacle, but dosojin does not contain any`)
        }

        if (this.receptacles.length > 1) {
            throw new Error(`Trying to select receptacle, but dosojin contains more than one. Override selectReceptacle method to provide custom selection.`)
        }

        return gem.setReceptacleEntity(this.name, this.receptacles[0].name);
    }

    public async selectConnector(gem: Gem): Promise<Gem> {

        if (this.connectors.length === 0) {
            throw new Error(`Trying to select connector, but dosojin does not contain any`)
        }

        if (this.connectors.length > 1) {
            throw new Error(`Trying to select connector, but dosojin contains more than one. Override selectConnector method to provide custom selection.`)
        }

        return gem.setConnectorEntity(this.name, this.connectors[0].name);

    }

    public async selectOperations(gem: Gem): Promise<Gem> {
        return gem.setOperationEntities(this.name, this.operations.map((op: Operation) => op.name));
    }

    protected addConnector(connector: Connector): void {
        this.connectors.push(connector);
    }

    protected addReceptacle(receptacle: Receptacle): void {
        this.receptacles.push(receptacle);
    }

    protected addOperation(operation: Operation): void {
        this.operations.push(operation);
    }

}
