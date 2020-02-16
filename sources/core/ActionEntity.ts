import { Gem }          from './Gem';

export const SECOND: number = 1000;
export const MINUTE: number = 60000;
export const HOUR: number = 3600000;

export abstract class ActionEntity {
    public name: string;
    public refreshTimer: number;

    constructor(name: string) {
        this.name = name;
    }

    public abstract async run(gem: Gem): Promise<Gem>;
    public abstract async dryRun(gem: Gem): Promise<Gem>;
    public abstract async scopes(gem: Gem): Promise<string[]>;
}
