import BN = require('bn.js');
import { Circuit } from '../../core/Circuit';
import { SingleDosojinLayer } from '../../core/SingleDosojinLayer';
import { TransferReceptacleStatusNames } from '../../core/TransferStatus';
import { BasicDosojinMock } from '../../mocks/dosojin/BasicDosojinMock';

export function create_gem_tests(): void {
    let circuit: Circuit;
    let circuitName: string;

    beforeEach(() => {
        circuitName = 'circuitName';
        circuit = new Circuit(circuitName);
    });

    test('throw error when empty circuit', async () => {
        await expect(circuit.createGem()).rejects.toThrow();
        await expect(circuit.createGem()).rejects.toMatchObject({
            circuit: circuitName,
            message: 'cannot create Gem in empty Circuit',
            name: 'CircuitError'
        });
    });

    test('return gem when layers, dosojins and entities are set', async () => {
        const expectedObject: object = {
            actionType: 'transfer',
            errorInfo: null,
            gemData: {},
            gemPayload: {
                costs: [],
                values: {
                    fiat_euro: new BN(10),
                    fiat_usd: new BN(5)
                }
            },
            operationStatus: null,
            routeHistory: [],
            transferStatus: {
                receptacle: {
                    dosojin: 'BasicDosojinMock_test',
                    layer: 0,
                    name: 'BasicDosojinReceptacle',
                    status: TransferReceptacleStatusNames.ReadyForTransfer
                }
            }
        }
        const dosojin: BasicDosojinMock = new BasicDosojinMock('test');
        const sdl: SingleDosojinLayer = new SingleDosojinLayer('sdl');

        circuit.pushLayer(sdl);

        sdl.setDosojin(dosojin);
        
        await expect(circuit.createGem({fiat_euro: new BN(10), fiat_usd: new BN(5)})).resolves.toMatchObject(expectedObject);
    });
}