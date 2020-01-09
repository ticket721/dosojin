import BN from 'bn.js';

export type Scope = string;

export interface ScopedValues {
    [key: string]: BN;
}

export interface MinMax {
    min: BN;
    max: BN;
}

export interface ScopedCost {
    value: BN | MinMax;
    scope: Scope;
    dosojin: string;
    entityName: string;
    entityType: string;
    layer: number;
    reason: string;
}
