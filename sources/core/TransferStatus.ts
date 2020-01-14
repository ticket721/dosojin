export enum TransferConnectorStatusNames {
    ReadyForTransfer = 'ReadyForTransfer',
    TransferComplete = 'TransferComplete',
}

export enum TransferReceptacleStatusNames {
    ReadyForTransfer = 'ReadyForTransfer',
    TransferComplete = 'TransferComplete',
}

export interface TransferEntityInfo<CustomStatusSet> {
    status: CustomStatusSet;
    layer: number;
    dosojin: string;
    name: string;
}

export interface TransferStatus<
    CustomConnectorStatusSet extends TransferConnectorStatusNames = TransferConnectorStatusNames,
    CustomReceptacleStatusSet extends TransferReceptacleStatusNames = TransferReceptacleStatusNames
    > {
    connector: TransferEntityInfo<TransferConnectorStatusNames>;
    receptacle: TransferEntityInfo<TransferReceptacleStatusNames>;
}
