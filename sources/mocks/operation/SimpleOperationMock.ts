import { Dosojin, Gem, Operation } from '../../core';

export class SimpleOperationMock extends Operation {

    constructor(name: string, dosojin: Dosojin) {
        super(name, dosojin);
    }

    public async run(gem: Gem): Promise<Gem> {
        return null;
    }

    public async dryRun(gem: Gem): Promise<Gem> {
        return null;
    }

    public async cost(gem: Gem): Promise<Gem> {
        return null;
    }

    public async scopes(gem: Gem): Promise<string[]> {
        return null;
    }
}
