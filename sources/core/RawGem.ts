export interface RawGem {
    action_type: 'operation' | 'transfer';
    operation_status: {
        status: string;
        layer: number;
        dosojin: string;
        operation_list: string[];
    };
    transfer_status: {
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
    gem_status: 'Running' | 'Complete' | 'Error' | 'Fatal' | 'MissingReceptacle';
    gem_payload: {
        values: {
            [key: string]: string;
        };
        costs: {
            value:
                | string
                | {
                min: string;
                max: string;
            };
            scope: string;
            dosojin: string;
            entity_name: string;
            entity_type: string;
            layer: number;
            reason: string;
        }[];
    };
    error_info: {
        dosojin: string;
        entity_name: string;
        entity_type: string;
        layer: number;
        message: string;
    };
    route_history: {
        layer: number;
        dosojin: string;
        entity_name: string;
        entity_type: string;
        count: number;
    }[];
    gem_data: { [key: string]: any };
    refresh_timer: number;
}
