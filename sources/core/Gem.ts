import { OperationStatus, OperationStatusNames }                                       from './OperationStatus';
import { TransferConnectorStatusNames, TransferReceptacleStatusNames, TransferStatus } from './TransferStatus';

export class Gem<
    CustomOperationStatusSet extends OperationStatusNames = OperationStatusNames,
    CustomTransferConnectorStatusSet extends TransferConnectorStatusNames = TransferConnectorStatusNames,
    CustomTransferReceptacleStatusSet extends TransferReceptacleStatusNames = TransferReceptacleStatusNames
    > {
    public actionType: 'operation' | 'transfer' = 'transfer';
    public operationStatus: Partial<OperationStatus<CustomOperationStatusSet>> | null = null;
    public transferStatus: Partial<TransferStatus<CustomTransferConnectorStatusSet, CustomTransferReceptacleStatusSet>> | null = null;
    public gemStatus: 'Running' | 'Complete' | 'Error' = 'Running';

    public nextOperation(): Gem {
        this.verifyActionType('operation', `Invalid actionType for nextOperation call (transfer instead of operation)`);

        if (this.operationStatus) {

            this.setOperationEntities(this.operationStatus.dosojin, this.operationStatus.operation_list.slice(1));

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

    public setGemStatus(status: 'Running' | 'Complete'): Gem {
        this.gemStatus = status;
        return this;
    }

    public error(): Gem {
        this.gemStatus = 'Error';
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

    public setReceptacleEntity(dosojin: string, entityName: string): Gem {
        this.verifyActionType('transfer', `Invalid actionType for setReceptacleEntity call (operation instead of transfer)`);

        if (this.transferStatus === null) {
            this.transferStatus = {};
        }

        this.transferStatus = {
            ...this.transferStatus,
            receptacle: {
                ...(this.transferStatus.receptacle || {layer: null, status: null}),
                dosojin,
                name: entityName
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

    public setConnectorEntity(dosojin: string, entityName: string): Gem {
        this.verifyActionType('transfer', `Invalid actionType for setConnectorEntity call (operation instead of transfer)`);

        if (this.transferStatus === null) {
            this.transferStatus = {};
        }

        this.transferStatus = {
            ...this.transferStatus,
            connector: {
                ...(this.transferStatus.connector || {layer: null, status: null}),
                dosojin,
                name: entityName
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

    public setOperationEntities(dosojin: string, operationList: string[]): Gem {
        this.verifyActionType('operation', `Invalid actionType for setOperationEntities call (transfer instead of operation)`);

        if (this.operationStatus === null) {
            this.operationStatus = {};
        }

        this.operationStatus = {
            ...this.operationStatus,
            dosojin,
            operation_list: operationList
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
            throw new Error(error)
        }
    }

}
