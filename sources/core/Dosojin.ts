import { Connector }    from './Connector';
import { DosojinError } from './errors/DosojinError';
import { Gem }          from './Gem';
import { Operation }    from './Operation';
import { Receptacle }   from './Receptacle';

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
                    throw new DosojinError(this.name, `unkown Connector ${gem.transferStatus.connector.name} in Dosojin ${this.name}`);
                }

                const connector: Connector = this.connectors[connectorIndex];

                return connector.run(gem);

            } else if (gem.transferStatus.receptacle && gem.transferStatus.receptacle.dosojin === this.name) {
                const receptacleIndex = this.receptacles.findIndex((re: Receptacle) => re.name === gem.transferStatus.receptacle.name);

                if (receptacleIndex === -1) {
                    throw new DosojinError(this.name, `unkown Receptacle ${gem.transferStatus.receptacle.name} in Dosojin ${this.name}`);
                }

                const receptacle: Receptacle = this.receptacles[receptacleIndex];

                return receptacle.run(gem);

            } else {
                throw new DosojinError(this.name, `received Gem with 'transfer' action type, but no Connector or Receptacle for ${this.name} dosojin`);
            }

        } else {
            throw new DosojinError(this.name, `received Gem with null transferStatus while on 'transfer' actionType`);
        }

    }

    public async runOperation(gem: Gem): Promise<Gem> {

        if (gem.operationStatus) {

            if (gem.operationStatus.dosojin !== this.name) {
                throw new DosojinError(this.name, `received invalid Gem with invalid Dosojin name: expected ${this.name}, got ${gem.operationStatus.dosojin}`)
            }

            if (gem.operationStatus.operation_list.length === 0) {
                throw new DosojinError(this.name, `received invalid Gem with no Operations left.`)
            }

            const operationIndex: number = this.operations.findIndex((op: Operation) => op.name === gem.operationStatus.operation_list[0]);

            if (operationIndex === -1) {
                throw new DosojinError(this.name, `unknown Operation ${gem.operationStatus.operation_list[0]} in Dosojin ${this.name}`);
            }

            const operation: Operation = this.operations[operationIndex];

            return operation.run(gem);

        } else {
            throw new DosojinError(this.name, `received Gem with null operationStatus while on 'operation' actionType`);
        }

    }

    public async run(gem: Gem): Promise<Gem> {
        switch (gem.actionType) {
            case 'operation': {
                try {
                    return await this.runOperation(gem);
                } catch (e) {
                    throw new DosojinError(this.name, e);
                }
            }
            case 'transfer': {
                try {
                    return await this.runTransfer(gem);
                } catch (e) {
                    throw new DosojinError(this.name, e);
                }
            }
            default: {
                throw new DosojinError(this.name, `received Gem with invalid actionType ${gem.actionType}`);
            }
        }
    }

    public async setReceptacleInfo<ReceptacleInfo = any>(gem: Gem, receptacleInfo: ReceptacleInfo): Promise<void> {
        switch (gem.actionType) {
            case 'transfer': {
                try {

                    if (gem.transferStatus.connector && gem.transferStatus.connector.dosojin === this.name) {

                        const connectorIndex = this.connectors.findIndex((co: Connector) => co.name === gem.transferStatus.connector.name);

                        if (connectorIndex === -1) {
                            throw new DosojinError(this.name, `unkown Connector ${gem.transferStatus.connector.name} in Dosojin ${this.name}`);
                        }

                        const connector: Connector = this.connectors[connectorIndex];

                        await connector.setReceptacleInfo(receptacleInfo);

                        return ;

                    } else {
                        throw new DosojinError(this.name, `received Gem with 'transfer' action type, but no Connector or Receptacle for ${this.name} dosojin`);
                    }

                } catch (e) {
                    throw new DosojinError(this.name, e);
                }
            }
            default: {
                throw new DosojinError(this.name, `received Gem with invalid actionType ${gem.actionType} while getting Connector info`);
            }
        }
    }

    public async getConnectorInfo(gem: Gem): Promise<Gem> {
        switch (gem.actionType) {
            case 'transfer': {
                try {

                    if (gem.transferStatus.connector && gem.transferStatus.connector.dosojin === this.name) {

                        const connectorIndex = this.connectors.findIndex((co: Connector) => co.name === gem.transferStatus.connector.name);

                        if (connectorIndex === -1) {
                            throw new DosojinError(this.name, `unkown Connector ${gem.transferStatus.connector.name} in Dosojin ${this.name}`);
                        }

                        const connector: Connector = this.connectors[connectorIndex];

                        return connector.getConnectorInfo(gem);

                    } else {
                        throw new DosojinError(this.name, `received Gem with 'transfer' action type, but no Connector or Receptacle for ${this.name} dosojin`);
                    }

                } catch (e) {
                    throw new DosojinError(this.name, e);
                }
            }
            default: {
                throw new DosojinError(this.name, `received Gem with invalid actionType ${gem.actionType} while getting Connector info`);
            }
        }
    }

    public async setConnectorInfo<ConnectorInfo = any>(gem: Gem, connectorInfo: ConnectorInfo): Promise<void> {
        switch (gem.actionType) {
            case 'transfer': {
                try {

                    if (gem.transferStatus.receptacle && gem.transferStatus.receptacle.dosojin === this.name) {
                        const receptacleIndex = this.receptacles.findIndex((re: Receptacle) => re.name === gem.transferStatus.receptacle.name);

                        if (receptacleIndex === -1) {
                            throw new DosojinError(this.name, `unkown Receptacle ${gem.transferStatus.receptacle.name} in Dosojin ${this.name}`);
                        }

                        const receptacle: Receptacle = this.receptacles[receptacleIndex];

                        await receptacle.setConnectorInfo(connectorInfo);

                        return ;

                    } else {
                        throw new DosojinError(this.name, `received Gem with 'transfer' action type, but no Connector or Receptacle for ${this.name} Dosojin`);
                    }

                } catch (e) {
                    throw new DosojinError(this.name, e);
                }
            }
            default: {
                throw new DosojinError(this.name, `received Gem with invalid actionType ${gem.actionType} while getting Receptacle info`);
            }
        }
    }

    public async getReceptacleInfo(gem: Gem): Promise<Gem> {
        switch (gem.actionType) {
            case 'transfer': {
                try {

                    if (gem.transferStatus.receptacle && gem.transferStatus.receptacle.dosojin === this.name) {
                        const receptacleIndex = this.receptacles.findIndex((re: Receptacle) => re.name === gem.transferStatus.receptacle.name);

                        if (receptacleIndex === -1) {
                            throw new DosojinError(this.name, `unkown Receptacle ${gem.transferStatus.receptacle.name} in Dosojin ${this.name}`);
                        }

                        const receptacle: Receptacle = this.receptacles[receptacleIndex];

                        return receptacle.getReceptacleInfo(gem);

                    } else {
                        throw new DosojinError(this.name, `received Gem with 'transfer' action type, but no Connector or Receptacle for ${this.name} Dosojin`);
                    }

                } catch (e) {
                    throw new DosojinError(this.name, e);
                }
            }
            default: {
                throw new DosojinError(this.name, `received Gem with invalid actionType ${gem.actionType} while getting Receptacle info`);
            }
        }
    }

    public async selectReceptacle(gem: Gem): Promise<Gem> {

        if (this.receptacles.length === 0) {
            throw new DosojinError(this.name, `trying to select Receptacle, but Dosojin does not contain any`)
        }

        if (this.receptacles.length > 1) {
            throw new DosojinError(this.name, `trying to select Receptacle, but Dosojin contains more than one. Override selectReceptacle method to provide custom selection.`)
        }

        return gem.setReceptacleEntity(this.name, this.receptacles[0]);
    }

    public async selectConnector(gem: Gem): Promise<Gem> {

        if (this.connectors.length === 0) {
            throw new DosojinError(this.name, `trying to select Connector, but Dosojin does not contain any`)
        }

        if (this.connectors.length > 1) {
            throw new DosojinError(this.name, `trying to select Connector, but Dosojin contains more than one. Override selectConnector method to provide custom selection.`)
        }

        return gem.setConnectorEntity(this.name, this.connectors[0]);

    }

    public async selectOperations(gem: Gem): Promise<Gem> {
        return gem.setOperationEntities(this.name, this.operations);
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
