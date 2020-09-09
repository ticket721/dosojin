import { Dosojin, Gem, Layer } from '../../core';

export class RegistryLayerMock extends Layer {
    private add: (name: string) => void;
    private rm: (name: string) => void;

    public async addDosojin(dosojin: Dosojin): Promise<void> {
        this.add(dosojin.name);
    }

    public async removeDosojin(dosojin: Dosojin): Promise<void> {
        this.rm(dosojin.name);
    }

    public async setReceptacleInfo<ReceptacleInfo = any>(gem: Gem, receptacleInfo: ReceptacleInfo): Promise<void> {
        return null;
    }

    public async getConnectorInfo(gem: Gem): Promise<Gem> {
        return null;
    }

    public async setConnectorInfo<ConnectorInfo>(gem: Gem, connectorInfo: ConnectorInfo): Promise<void> {
        return null;
    }

    public async getReceptacleInfo(gem: Gem): Promise<Gem> {
        return null;
    }

    public async run(gem: Gem): Promise<Gem> {
        return null;
    }

    public async dryRun(gem: Gem): Promise<Gem> {
        return null;
    }

    public async selectReceptacle(gem: Gem): Promise<Gem> {
        return null;
    }

    public async selectConnector(gem: Gem): Promise<Gem> {
        return null;
    }

    public async selectOperations(gem: Gem): Promise<Gem> {
        return null;
    }

    public setRegistry(add: (name: string) => void, rm: (name: string) => void): void {
        this.add = add;
        this.rm = rm;
    }
}
