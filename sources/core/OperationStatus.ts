export enum OperationStatusNames {
    ReadyForOperation = 'ReadyForOperation',
    OperationComplete = 'OperationComplete',
}

export interface OperationStatus<CustomStatusSet extends OperationStatusNames = OperationStatusNames> {
    status: CustomStatusSet;
    layer: number;
    dosojin: string;
    operation_list: string[];
}
