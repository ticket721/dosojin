import {Connector, Dosojin, Gem } from '../../core';

export class SimpleConnectorMock extends Connector {

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

    public async getConnectorInfo(gem: Gem): Promise<any> {
        return null;
    }

    public async setReceptacleInfo(info: any): Promise<void> {
        return null;
    }
}
