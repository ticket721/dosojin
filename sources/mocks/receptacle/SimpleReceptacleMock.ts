import { Dosojin, Gem, Receptacle } from '../../core';

export class SimpleReceptacleMock extends Receptacle {
    constructor(name: string, dosojin: Dosojin) {
        super(name, dosojin);
    }

    public async run(gem: Gem): Promise<Gem> {
        return null;
    }

    public async dryRun(gem: Gem): Promise<Gem> {
        return null;
    }

    public async scopes(gem: Gem): Promise<string[]> {
        return null;
    }

    public async getReceptacleInfo(gem: Gem): Promise<any> {
        return null;
    }

    public async setConnectorInfo(info: any): Promise<void> {
        return null;
    }
}
