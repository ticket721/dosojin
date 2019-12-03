import { Gem }          from './Gem';
import { ScopedValues } from './Scope';

export abstract class ActionEntity {
    public name: string;

    constructor(name: string) {
        this.name = name;
    }

    public abstract async run(gem: Gem): Promise<Gem>;
    public abstract async cost(gem: Gem): Promise<ScopedValues>;
    public abstract async scopes(gem: Gem): Promise<string[]>;
}
