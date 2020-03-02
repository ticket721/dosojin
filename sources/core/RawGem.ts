export interface RawGem {
    actionType: 'operation' | 'transfer';
    operationStatus: {
        status: string;
        layer: number;
        dosojin: string;
        operation_list: string[];
    };
    transferStatus: {
        connector: {
            status: string;
            layer: number;
            dosojin: string;
            name: string;
        };
        receptacle: {
            status: string;
            layer: number;
            dosojin: string;
            name: string;
        };
    };
    gemStatus: 'Running' | 'Complete' | 'Error' | 'Fatal' | 'MissingReceptacle';
    gemPayload: {
        values: {
            [key: string]: string;
        };
        costs: {
            value: string | {
                min: string;
                max: string;
            };
            scope: string;
            dosojin: string;
            entityName: string;
            entityType: string;
            layer: number;
            reason: string;
        }[];
    };
    errorInfo: {
        dosojin: string;
        entityName: string;
        entityType: string;
        layer: number;
        message: string;
    };
    routeHistory: {
        layer: number;
        dosojin: string;
        entityName: string;
        entityType: string;
        count: number;
    }[];
    gemData: {[key: string]: any};
    refreshTimer: number;
}
