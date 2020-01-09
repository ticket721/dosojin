import { Dosojin } from '../../core/Dosojin';
import { CircuitError } from '../../core/errors/CircuitError';
import { Gem } from '../../core/Gem';
import { Layer } from '../../core/Layer';

export class RegistryLayerMock extends Layer {

    private add: (name: string) => void;
    private rm: (name: string) => void;

    public addDosojin(dosojin: Dosojin): void {
        try {
            return this.add(dosojin.name);
            // console.log('test');
        } catch(e) {
            console.log(e);
            throw new CircuitError('circuitName', e);
        }
    }

    public removeDosojin(dosojin: Dosojin): void {
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
