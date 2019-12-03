import BN from 'bn.js';

export type Scope = string;

export interface ScopedValues {
    [key: string]: BN;
}

export interface ScopedCost {
    value: BN;
    scope: Scope;
    dosojin: string;
    entityName: string;
    entityType: string;
    layer: number;
    reason: string;
}

