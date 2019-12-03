import { ScopedCost, ScopedValues } from './Scope';

export interface GemPayload {
    values: ScopedValues;
    costs: ScopedCost[];
}
