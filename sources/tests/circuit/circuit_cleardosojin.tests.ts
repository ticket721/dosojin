import { Circuit } from '../../core/Circuit';
import { Dosojin } from '../../core/Dosojin';
import { RegistryLayerMock } from '../../mocks/layer/RegistryLayerMock';

export function clear_dosojin_tests(): void {
    let circuit: Circuit;
    let circuitName: string;
    let sdl: RegistryLayerMock;
    let dosojin: Dosojin;

    beforeEach(() => {
        sdl = new RegistryLayerMock('sdl');
        dosojin = new Dosojin('dosojin');
        circuitName = 'circuitName';
        circuit = new Circuit(circuitName, [sdl]);
    });

    xtest('throw circuit error when dosojin name did not exists in registry', async () => {
        expect(sdl.removeDosojin(dosojin)).toThrow();
        expect(sdl.removeDosojin(dosojin)).toMatchObject({
            circuit: circuitName,
            message: `Dosojin with name dosojin not registered by Circuit ${circuitName}`,
            name: 'CircuitError'
        });
    });

    test('unregister dosojin when dosojin name does exist in registry', async () => {
        sdl.addDosojin(dosojin);

        expect(circuit.getRegistry()).toMatchObject({
            'dosojin': true,
        });

        sdl.removeDosojin(dosojin);

        expect(circuit.getRegistry()).toMatchObject({
            'dosojin': false,
        });
    });
}