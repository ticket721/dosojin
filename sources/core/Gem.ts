import BN from 'bn.js';
import Decimal from 'decimal.js';
import { Connector } from './Connector';
import { Dosojin } from './Dosojin';
import { GemPayload } from './GemPayload';
import { Operation } from './Operation';
import { OperationStatus, OperationStatusNames } from './OperationStatus';
import { Receptacle } from './Receptacle';
import { MinMax, ScopedCost, ScopedValues } from './Scope';
import { TransferConnectorStatusNames, TransferReceptacleStatusNames, TransferStatus } from './TransferStatus';
import { RawGem } from './RawGem';

type GemStatus = 'Running' | 'Complete' | 'Error' | 'Fatal' | 'MissingReceptacle';

interface GemErrorInfo {
    dosojin: string;
    entityName: string;
    entityType: string;
    layer: number;
    message: string;
}

export interface HistoryEntity {
    layer: number;
    dosojin: string;
    entityName: string;
    entityType: string;
    count: number;
}

export class Gem<
    CustomOperationStatusSet extends OperationStatusNames = OperationStatusNames,
    CustomTransferConnectorStatusSet extends TransferConnectorStatusNames = TransferConnectorStatusNames,
    CustomTransferReceptacleStatusSet extends TransferReceptacleStatusNames = TransferReceptacleStatusNames
    > {
    public actionType: 'operation' | 'transfer' = 'transfer';
    public operationStatus: Partial<OperationStatus<CustomOperationStatusSet>> | null = null;
    public transferStatus: Partial<
        TransferStatus<CustomTransferConnectorStatusSet, CustomTransferReceptacleStatusSet>
        > | null = null;
    public gemStatus: GemStatus;
    public gemPayload: GemPayload = null;
    public errorInfo: GemErrorInfo = null;
    public routeHistory: HistoryEntity[] = [];
    private gemData: { [key: string]: any } = {};
    private refreshTimer: number = null;

    constructor(initialValues: ScopedValues = {}) {
        this.gemPayload = {
            costs: [],
            values: initialValues,
        };
    }

    public exchange(scope: string, newScope: string, amount: BN, rate: number): Gem {
        if (this.gemPayload.values[scope] === undefined) {
            throw new Error(`No such scope ${scope} on gem for exchange`);
        }

        if (this.gemPayload.values[scope].lt(amount)) {
            throw new Error(`Invalid amount too low on scope ${scope}`);
        }

        const newAmount = new Decimal(amount.toString()).mul(new Decimal(rate)).round();

        if (this.gemPayload.values[newScope]) {
            this.gemPayload.values[newScope] = this.gemPayload.values[newScope].add(new BN(newAmount.toString()));
        } else {
            this.gemPayload.values[newScope] = new BN(newAmount.toString());
        }

        if (this.gemPayload.values[scope].eq(amount)) {
            delete this.gemPayload.values[scope];
        } else {
            this.gemPayload.values[scope] = this.gemPayload.values[scope].sub(amount);
        }

        return this;
    }

    public get raw(): RawGem {
        const values: { [key: string]: string } = {};

        for (const valueKey of Object.keys(this.gemPayload.values)) {
            values[valueKey] = this.gemPayload.values[valueKey].toString();
        }

        return {
            action_type: this.actionType,
            operation_status: this.operationStatus
                ? {
                    status: this.operationStatus.status,
                    layer: this.operationStatus.layer,
                    dosojin: this.operationStatus.dosojin,
                    operation_list: this.operationStatus.operation_list,
                }
                : null,
            transfer_status: this.transferStatus
                ? {
                    connector: this.transferStatus.connector
                        ? {
                            status: this.transferStatus.connector.status,
                            layer: this.transferStatus.connector.layer,
                            dosojin: this.transferStatus.connector.dosojin,
                            name: this.transferStatus.connector.name,
                        }
                        : null,
                    receptacle: this.transferStatus.receptacle
                        ? {
                            status: this.transferStatus.receptacle.status,
                            layer: this.transferStatus.receptacle.layer,
                            dosojin: this.transferStatus.receptacle.dosojin,
                            name: this.transferStatus.receptacle.name,
                        }
                        : null,
                }
                : null,
            gem_status: this.gemStatus,
            gem_payload: {
                values,
                costs: this.gemPayload.costs.map((cost: ScopedCost): any => {
                    let value;
                    if ((cost.value as any).min && (cost.value as any).max) {
                        cost.value = cost.value as MinMax;
                        value = {
                            min: cost.value.min.toString(),
                            max: cost.value.max.toString(),
                        };
                    } else {
                        value = cost.value.toString();
                    }

                    return {
                        scope: cost.scope,
                        dosojin: cost.dosojin,
                        entity_name: cost.entityName,
                        entity_type: cost.entityType,
                        layer: cost.layer,
                        reason: cost.reason,
                        value,
                    };
                }),
            },
            error_info: this.errorInfo
                ? {
                    dosojin: this.errorInfo.dosojin,
                    entity_name: this.errorInfo.entityName,
                    entity_type: this.errorInfo.entityType,
                    layer: this.errorInfo.layer,
                    message: this.errorInfo.message,
                }
                : null,
            route_history: this.routeHistory.map((rh: HistoryEntity): any => ({
                layer: rh.layer,
                dosojin: rh.dosojin,
                entity_name: rh.entityName,
                entity_type: rh.entityType,
                count: rh.count,
            })),
            gem_data: this.gemData,
            refresh_timer: this.refreshTimer,
        };
    }

    public load(raw: RawGem): Gem {
        const values: { [key: string]: BN } = {};

        for (const valueKey of Object.keys(raw.gem_payload.values)) {
            values[valueKey] = new BN(raw.gem_payload.values[valueKey]);
        }

        this.actionType = raw.action_type;
        this.operationStatus = raw.operation_status
            ? {
                status: raw.operation_status.status as any,
                layer: raw.operation_status.layer,
                dosojin: raw.operation_status.dosojin,
                operation_list: raw.operation_status.operation_list,
            }
            : null;
        this.transferStatus = raw.transfer_status
            ? {
                connector: raw.transfer_status.connector
                    ? {
                        status: raw.transfer_status.connector.status as any,
                        layer: raw.transfer_status.connector.layer,
                        dosojin: raw.transfer_status.connector.dosojin,
                        name: raw.transfer_status.connector.name,
                    }
                    : null,
                receptacle: raw.transfer_status.receptacle
                    ? {
                        status: raw.transfer_status.receptacle.status as any,
                        layer: raw.transfer_status.receptacle.layer,
                        dosojin: raw.transfer_status.receptacle.dosojin,
                        name: raw.transfer_status.receptacle.name,
                    }
                    : null,
            }
            : null;
        this.gemStatus = raw.gem_status;
        this.gemPayload = {
            values,
            costs: raw.gem_payload.costs.map(
                (cost: any): ScopedCost => ({
                    value:
                        typeof cost.value === 'string'
                            ? new BN(cost.value)
                            : {
                                min: new BN(cost.value.min),
                                max: new BN(cost.value.max),
                            },
                    scope: cost.scope,
                    dosojin: cost.dosojin,
                    entityName: cost.entity_name,
                    entityType: cost.entity_type,
                    layer: cost.layer,
                    reason: cost.reason,
                }),
            ),
        };
        this.errorInfo = raw.error_info
            ? {
                dosojin: raw.error_info.dosojin,
                entityName: raw.error_info.entity_name,
                entityType: raw.error_info.entity_type,
                layer: raw.error_info.layer,
                message: raw.error_info.message,
            }
            : null;
        this.routeHistory = raw.route_history.map(
            (rh: any): HistoryEntity => ({
                layer: rh.layer,
                dosojin: rh.dosojin,
                entityName: rh.entity_name,
                entityType: rh.entity_type,
                count: rh.count,
            }),
        );
        this.gemData = raw.gem_data;
        this.refreshTimer = raw.refresh_timer;

        return this;
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
            message: null,
        };
        return this;
    }

    public setRefreshTimer(milliseconds: number): void {
        this.refreshTimer = milliseconds;
    }

    public getRefreshTimer(): number {
        return this.refreshTimer;
    }

    public getState<DosojinState = any>(dosojin: Dosojin): DosojinState {
        return this.gemData[dosojin.name];
    }

    public setState<DosojinState = any>(dosojin: Dosojin | string, data: Partial<DosojinState>): void {
        if (!data) {
            return;
        }

        let stateKey: string = null;

        switch (typeof dosojin) {
            case 'string':
                stateKey = dosojin;
                break;
            case 'object':
                stateKey = dosojin.name;
                break;
        }

        if (stateKey === null) {
            throw new Error(`invalid state key type: expect string | Dosojin, got ${typeof dosojin}`);
        }

        if (!this.gemData[stateKey]) {
            this.gemData[stateKey] = {};
        }

        this.gemData[stateKey] = {
            ...this.gemData[stateKey],
            ...data,
        };
    }

    public addCost(dosojin: Dosojin, value: BN | MinMax, scope: string, reason: string): Gem {
        let layer: number;
        let entityName: string;
        let entityType: string;

        switch (this.actionType) {
            case 'transfer': {
                if (this.transferStatus.connector && this.transferStatus.connector.dosojin === dosojin.name) {
                    layer = this.transferStatus.connector.layer;
                    entityName = this.transferStatus.connector.name;
                    entityType = 'connector';
                } else if (this.transferStatus.receptacle && this.transferStatus.receptacle.dosojin === dosojin.name) {
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

        this.pushCost({ value, scope, dosojin: dosojin.name, entityName, entityType, layer, reason });

        return this;
    }

    public setPayloadValues(values: ScopedValues): Gem {
        this.gemPayload.values = values;
        return this;
    }

    public updatePayloadValue(scope: string, value: BN | number): Gem {
        if (!this.getCurrentScopes().includes(scope)) {
            throw new Error(`The scope ${scope} does not exist on gem payload`);
        }

        if (typeof value === 'number') {
            this.gemPayload.values[scope] = new BN(value);
        } else {
            this.gemPayload.values[scope] = value;
        }

        return this;
    }

    public addPayloadValue(scope: string, value: BN | number): Gem {
        if (!this.getCurrentScopes().includes(scope)) {
            this.gemPayload.values[scope] = new BN(0);
        }

        if (typeof value === 'number') {
            this.gemPayload.values[scope] = this.gemPayload.values[scope].addn(value);
        } else {
            this.gemPayload.values[scope] = this.gemPayload.values[scope].add(value);
        }

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
        this.verifyActionType(
            'transfer',
            `Invalid actionType for setReceptacleStatus call (operation instead of transfer)`,
        );

        if (this.transferStatus === null) {
            this.transferStatus = {};
        }

        this.transferStatus = {
            ...this.transferStatus,
            receptacle: {
                ...(this.transferStatus.receptacle || { layer: null, dosojin: null, name: null }),
                status,
            },
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
                    break;
                }
            }

            if (!matched) {
                return false;
            }
        }

        return currentScopes.length === 0;
    }

    public async setReceptacleEntity(dosojin: string, entity: Receptacle): Promise<Gem> {
        this.verifyActionType(
            'transfer',
            `Invalid actionType for setReceptacleEntity call (operation instead of transfer)`,
        );

        const entityScopes = await entity.scopes(this);
        if (!this.checkScopesCompatibility(entityScopes)) {
            throw new Error(
                `Incompatible scopes with entity ${
                    entity.name
                }: got ${entityScopes} expected to match ${this.getCurrentScopes()}`,
            );
        }

        if (this.transferStatus === null) {
            this.transferStatus = {};
        }

        this.transferStatus = {
            ...this.transferStatus,
            receptacle: {
                ...(this.transferStatus.receptacle || { layer: null, status: null }),
                dosojin,
                name: entity.name,
            },
        };

        return this;
    }

    public setReceptacleLayer(layer: number): Gem {
        this.verifyActionType(
            'transfer',
            `Invalid actionType for setReceptacleLayer call (operation instead of transfer)`,
        );

        if (this.transferStatus === null) {
            this.transferStatus = {};
        }

        this.transferStatus = {
            ...this.transferStatus,
            receptacle: {
                ...(this.transferStatus.receptacle || { status: null, dosojin: null, name: null }),
                layer,
            },
        };

        return this;
    }

    public setConnectorStatus(status: CustomTransferConnectorStatusSet): Gem {
        this.verifyActionType(
            'transfer',
            `Invalid actionType for setConnectorStatus call (operation instead of transfer)`,
        );

        if (this.transferStatus === null) {
            this.transferStatus = {};
        }

        this.transferStatus = {
            ...this.transferStatus,
            connector: {
                ...(this.transferStatus.connector || { layer: null, dosojin: null, name: null }),
                status,
            },
        };

        return this;
    }

    public async setConnectorEntity(dosojin: string, entity: Connector): Promise<Gem> {
        this.verifyActionType(
            'transfer',
            `Invalid actionType for setConnectorEntity call (operation instead of transfer)`,
        );

        const entityScopes = await entity.scopes(this);
        if (!this.checkScopesCompatibility(entityScopes)) {
            throw new Error(
                `Incompatible scopes with entity ${
                    entity.name
                }: got ${entityScopes} expected to match ${this.getCurrentScopes()}`,
            );
        }

        if (this.transferStatus === null) {
            this.transferStatus = {};
        }

        this.transferStatus = {
            ...this.transferStatus,
            connector: {
                ...(this.transferStatus.connector || { layer: null, status: null }),
                dosojin,
                name: entity.name,
            },
        };

        return this;
    }

    public setConnectorLayer(layer: number): Gem {
        this.verifyActionType(
            'transfer',
            `Invalid actionType for setConnectorLayer call (operation instead of transfer)`,
        );

        if (this.transferStatus === null) {
            this.transferStatus = {};
        }

        this.transferStatus = {
            ...this.transferStatus,
            connector: {
                ...(this.transferStatus.connector || { status: null, dosojin: null, name: null }),
                layer,
            },
        };

        return this;
    }

    public setOperationStatus(status: CustomOperationStatusSet): Gem {
        this.verifyActionType(
            'operation',
            `Invalid actionType for setOperationStatus call (transfer instead of operation)`,
        );

        if (this.operationStatus === null) {
            this.operationStatus = {};
        }

        this.operationStatus = {
            ...this.operationStatus,
            status,
        };

        return this;
    }

    public async setOperationEntities(dosojin: string, operations: Operation[]): Promise<Gem> {
        this.verifyActionType(
            'operation',
            `Invalid actionType for setOperationEntities call (transfer instead of operation)`,
        );

        for (const operation of operations) {
            const operationScopes = await operation.scopes(this);
            if (!this.checkScopesCompatibility(operationScopes)) {
                throw new Error(
                    `Incompatible scopes with operation ${
                        operation.name
                    }: got ${operationScopes} expected to match ${this.getCurrentScopes()}`,
                );
            }
        }

        if (this.operationStatus === null) {
            this.operationStatus = {};
        }

        this.operationStatus = {
            ...this.operationStatus,
            dosojin,
            operation_list: operations.map((op: Operation) => op.name),
        };

        return this;
    }

    public setOperationsLayer(layer: number): Gem {
        this.verifyActionType(
            'operation',
            `Invalid actionType for setOperationsLayer call (transfer instead of operation)`,
        );

        if (this.operationStatus === null) {
            this.operationStatus = {};
        }

        this.operationStatus = {
            ...this.operationStatus,
            layer,
        };

        return this;
    }

    public pushHistoryEntity(historyEntity: HistoryEntity): void {
        this.routeHistory.push(historyEntity);
    }

    public incrementHistoryEntity(idx: number): void {
        this.routeHistory[idx].count++;
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
        this.operationStatus.operation_list = list;
    }

    private setErrorInfos(dosojin: Dosojin, message: string): void {
        let layer: number;
        let entityName: string;
        let entityType: string;
        switch (this.actionType) {
            case 'transfer': {
                if (this.transferStatus.connector && this.transferStatus.connector.dosojin === dosojin.name) {
                    layer = this.transferStatus.connector.layer;
                    entityName = this.transferStatus.connector.name;
                    entityType = 'connector';
                } else if (this.transferStatus.receptacle && this.transferStatus.receptacle.dosojin === dosojin.name) {
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
            message,
        };
    }
}
