import { Gem }     from './Gem';

export abstract class Layer {
    public name: string;
    public index: number;

    constructor(name: string) {
        this.name = name;
    }

    public setIndex(idx: number): void {
        this.index = idx;
    }

    public abstract async run(gem: Gem): Promise<Gem>;
    public abstract async selectReceptacle(gem: Gem): Promise<Gem>;
    public abstract async selectConnector(gem: Gem): Promise<Gem>;
    public abstract async selectOperations(gem: Gem): Promise<Gem>;
    public abstract setRegistry(add: (name: string) => void, rm: (name: string) => void): void;
}
