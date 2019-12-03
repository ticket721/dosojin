import { Gem }         from './Gem';
import { ScopeValues } from './Scope';

export abstract class ActionEntity {
    public name: string;

    constructor(name: string) {
        this.name = name;
    }

    public abstract async run(gem: Gem): Promise<Gem>;
    public abstract async cost(gem: Gem): Promise<ScopeValues>;
}
