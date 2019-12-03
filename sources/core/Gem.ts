import BN                                        from 'bn.js';
import { Connector }                             from './Connector';
import { Dosojin }                               from './Dosojin';
import { GemPayload }                            from './GemPayload';
import { Operation }                             from './Operation';
import { OperationStatus, OperationStatusNames } from './OperationStatus';
import { Receptacle }                            from './Receptacle';
import { ScopedCost, ScopedValues }              from './Scope';
import { TransferConnectorStatusNames, TransferReceptacleStatusNames, TransferStatus } from './TransferStatus';

type GemStatus = 'Running' | 'Complete' | 'Error' | 'Fatal' | 'MissingReceptacle';

interface GemErrorInfo {
    dosojin: string;
    entityName: string;
    entityType: string;
    layer: number;
    message: string;
}

export class Gem<CustomOperationStatusSet extends OperationStatusNames = OperationStatusNames,
    CustomTransferConnectorStatusSet extends TransferConnectorStatusNames = TransferConnectorStatusNames,
    CustomTransferReceptacleStatusSet extends TransferReceptacleStatusNames = TransferReceptacleStatusNames> {
    public actionType: 'operation' | 'transfer' = 'transfer';
    public operationStatus: Partial<OperationStatus<CustomOperationStatusSet>> | null = null;
    public transferStatus: Partial<TransferStatus<CustomTransferConnectorStatusSet, CustomTransferReceptacleStatusSet>> | null = null;
    public gemStatus: GemStatus;
    public gemPayload: GemPayload = null;
    public errorInfo: GemErrorInfo = null;

    constructor(initialValues: ScopedValues) {
        this.gemPayload = {
            costs: [],
            values: initialValues
        };
    }

    public fatal(dosojin: Dosojin, message: string): Gem {
        this.setErrorInfos(dosojin, message);
        this.setGemStatus('Fatal');
        return this;
    }

    public error(dosojin: Dosojin, message: string): Gem {
        this.setErrorInfos(dosojin, message);
        this.setGemStatus('Error');
        return this;
    }

    public missingReceptacle(): Gem {
        this.setGemStatus('MissingReceptacle');
        this.errorInfo = {
            dosojin: this.transferStatus.connector.dosojin,
            entityName: this.transferStatus.connector.name,
            entityType: 'connector',
            layer: this.transferStatus.connector.layer,
            message: null
        };
        return this;
    }

    public addCost(dosojin: Dosojin, value: BN, scope: string, reason: string): Gem {
        let layer: number;
        let entityName: string;
        let entityType: string;
        switch (this.actionType) {
            case 'transfer': {
                if (this.transferStatus.connector && this.transferStatus.connector.name === dosojin.name) {
                    layer = this.transferStatus.connector.layer;
                    entityName = this.transferStatus.connector.name;
                    entityType = 'connector';
                } else if (this.transferStatus.receptacle && this.transferStatus.receptacle.name === dosojin.name) {
                    layer = this.transferStatus.receptacle.layer;
                    entityName = this.transferStatus.receptacle.name;
                    entityType = 'receptacle';
                } else {
                    throw new Error(`Cannot find specified dosojin inside transferStatus`);
                }
                break;
            }
            case 'operation': {
                layer = this.operationStatus.layer;
                entityName = this.operationStatus.operation_list[0];
                entityType = 'operation';
                break;
            }
            default: {
                throw new Error(`Cannot add cost on gem with no actionType`);
            }
        }

        this.pushCost({value, scope, dosojin: dosojin.name, entityName, entityType, layer, reason});

        return this;
    }

    public setPayloadValues(values: ScopedValues): Gem {
        this.gemPayload.values = values;
        return this;
    }

    public nextOperation(): Gem {
        this.verifyActionType('operation', `Invalid actionType for nextOperation call (transfer instead of operation)`);

        if (this.operationStatus) {

            this.setOperationList(this.operationStatus.operation_list.slice(1));

            if (this.operationStatus.operation_list.length) {

                this.setOperationStatus(OperationStatusNames.ReadyForOperation as any);
                return this;

            } else {

                this.setActionType('transfer');
                return this;

            }

        } else {
            throw new Error(`Invalid nextOperation call with null operationStatus`);
        }

    }

    public setGemStatus(status: GemStatus): Gem {
        if (['Error', 'Fatal'].indexOf(status) === -1) {
            this.errorInfo = null;
        }
        this.gemStatus = status;
        return this;
    }

    public setActionType(type: 'operation' | 'transfer'): Gem {
        this.actionType = type;
        if (type === 'operation') {
            this.transferStatus = null;
        } else {
            this.operationStatus = null;
        }
        return this;
    }

    public setReceptacleStatus(status: CustomTransferReceptacleStatusSet): Gem {
        this.verifyActionType('transfer', `Invalid actionType for setReceptacleStatus call (operation instead of transfer)`);

        if (this.transferStatus === null) {
            this.transferStatus = {};
        }

        this.transferStatus = {
            ...this.transferStatus,
            receptacle: {
                ...(this.transferStatus.receptacle || {layer: null, dosojin: null, name: null}),
                status
            }
        };

        return this;
    }

    public getCurrentScopes(): string[] {
        return Object.keys(this.gemPayload.values);
    }

    public checkScopesCompatibility(entityScopes: string[]): boolean {

        const currentScopes = this.getCurrentScopes();

        for (const entityScope of entityScopes) {
            let matched = false;

            for (const [idx, currentScope] of currentScopes.entries()) {
                const regexp = new RegExp(`^${entityScope}$`);
                if (regexp.test(currentScope)) {
                    currentScopes.splice(idx, 1);
                    matched = true;
                    break ;
                }
            }

            if (!matched) {
                return false;
            }

        }

        return currentScopes.length === 0 ;
    }

    public async setReceptacleEntity(dosojin: string, entity: Receptacle): Promise<Gem> {
        this.verifyActionType('transfer', `Invalid actionType for setReceptacleEntity call (operation instead of transfer)`);

        const entityScopes = await entity.scopes(this);
        if (!this.checkScopesCompatibility(entityScopes)) {
            throw new Error(`Incompatible scopes with entity ${entity.name}: got ${entityScopes} expected to match ${this.getCurrentScopes()}`)
        }

        if (this.transferStatus === null) {
            this.transferStatus = {};
        }

        this.transferStatus = {
            ...this.transferStatus,
            receptacle: {
                ...(this.transferStatus.receptacle || {layer: null, status: null}),
                dosojin,
                name: entity.name
            }
        };

        return this;
    }

    public setReceptacleLayer(layer: number): Gem {
        this.verifyActionType('transfer', `Invalid actionType for setReceptacleLayer call (operation instead of transfer)`);

        if (this.transferStatus === null) {
            this.transferStatus = {};
        }

        this.transferStatus = {
            ...this.transferStatus,
            receptacle: {
                ...(this.transferStatus.receptacle || {status: null, dosojin: null, name: null}),
                layer
            }
        };

        return this;
    }

    public setConnectorStatus(status: CustomTransferConnectorStatusSet): Gem {
        this.verifyActionType('transfer', `Invalid actionType for setConnectorStatus call (operation instead of transfer)`);

        if (this.transferStatus === null) {
            this.transferStatus = {};
        }

        this.transferStatus = {
            ...this.transferStatus,
            connector: {
                ...(this.transferStatus.connector || {layer: null, dosojin: null, name: null}),
                status
            }
        };

        return this;
    }

    public async setConnectorEntity(dosojin: string, entity: Connector): Promise<Gem> {
        this.verifyActionType('transfer', `Invalid actionType for setConnectorEntity call (operation instead of transfer)`);

        const entityScopes = await entity.scopes(this);
        if (!this.checkScopesCompatibility(entityScopes)) {
            throw new Error(`Incompatible scopes with entity ${entity.name}: got ${entityScopes} expected to match ${this.getCurrentScopes()}`)
        }

        if (this.transferStatus === null) {
            this.transferStatus = {};
        }

        this.transferStatus = {
            ...this.transferStatus,
            connector: {
                ...(this.transferStatus.connector || {layer: null, status: null}),
                dosojin,
                name: entity.name
            }
        };

        return this;
    }

    public setConnectorLayer(layer: number): Gem {
        this.verifyActionType('transfer', `Invalid actionType for setConnectorLayer call (operation instead of transfer)`);

        if (this.transferStatus === null) {
            this.transferStatus = {};
        }

        this.transferStatus = {
            ...this.transferStatus,
            connector: {
                ...(this.transferStatus.connector || {status: null, dosojin: null, name: null}),
                layer
            }
        };

        return this;
    }

    public setOperationStatus(status: CustomOperationStatusSet): Gem {
        this.verifyActionType('operation', `Invalid actionType for setOperationStatus call (transfer instead of operation)`);

        if (this.operationStatus === null) {
            this.operationStatus = {};
        }

        this.operationStatus = {
            ...this.operationStatus,
            status
        };

        return this;
    }

    public async setOperationEntities(dosojin: string, operations: Operation[]): Promise<Gem> {
        this.verifyActionType('operation', `Invalid actionType for setOperationEntities call (transfer instead of operation)`);

        for (const operation of operations) {
            const operationScopes = await operation.scopes(this);
            if (!this.checkScopesCompatibility(operationScopes)) {
                throw new Error(`Incompatible scopes with operation ${operation.name}: got ${operationScopes} expected to match ${this.getCurrentScopes()}`)
            }

        }

        if (this.operationStatus === null) {
            this.operationStatus = {};
        }

        this.operationStatus = {
            ...this.operationStatus,
            dosojin,
            operation_list: operations.map((op: Operation) => op.name)
        };

        return this;
    }

    public setOperationLayer(layer: number): Gem {
        this.verifyActionType('operation', `Invalid actionType for setOperationLayer call (transfer instead of operation)`);

        if (this.operationStatus === null) {
            this.operationStatus = {};
        }

        this.operationStatus = {
            ...this.operationStatus,
            layer
        };

        return this;
    }

    private verifyActionType(requiredType: 'operation' | 'transfer', error: string): void {
        if (requiredType !== this.actionType) {
            throw new Error(error);
        }
    }

    private pushCost(scopedCost: ScopedCost): void {
        this.gemPayload.costs.push(scopedCost);
    }

    private setOperationList(list: string[]): void {
        this.verifyActionType('operation', `Invalid actionType for setOperationStatus call (transfer instead of operation)`);

        if (!this.operationStatus) {
            this.operationStatus = {};
        }

        this.operationStatus.operation_list = list;

    }

    private setErrorInfos(dosojin: Dosojin, message: string): void {
        let layer: number;
        let entityName: string;
        let entityType: string;
        switch (this.actionType) {
            case 'transfer': {
                if (this.transferStatus.connector && this.transferStatus.connector.name === dosojin.name) {
                    layer = this.transferStatus.connector.layer;
                    entityName = this.transferStatus.connector.name;
                    entityType = 'connector';
                } else if (this.transferStatus.receptacle && this.transferStatus.receptacle.name === dosojin.name) {
                    layer = this.transferStatus.receptacle.layer;
                    entityName = this.transferStatus.receptacle.name;
                    entityType = 'receptacle';
                } else {
                    throw new Error(`Cannot find specified dosojin inside transferStatus`);
                }
                break;
            }
            case 'operation': {
                layer = this.operationStatus.layer;
                entityName = this.operationStatus.operation_list[0];
                entityType = 'operation';
                break;
            }
            default: {
                throw new Error(`Cannot set error on gem with no actionType`);
            }
        }

        this.errorInfo = {
            dosojin: dosojin.name,
            entityName,
            entityType,
            layer,
            message
        }

    }

}
