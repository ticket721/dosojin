import { Circuit } from '../../core/Circuit';
import { Dosojin } from '../../core/Dosojin';
import { RegistryLayerMock } from '../../mocks/layer/RegistryLayerMock';

export function register_dosojin_tests(): void {
    let circuit: Circuit;
    let circuitName: string;
    let sdl1: RegistryLayerMock;
    let sdl2: RegistryLayerMock;
    let dosojin: Dosojin;

    beforeEach(() => {
        sdl1 = new RegistryLayerMock('sdl1');
        sdl2 = new RegistryLayerMock('sdl2');
        dosojin = new Dosojin('dosojin');
        circuitName = 'circuitName';
        circuit = new Circuit(circuitName, [sdl1, sdl2]);
        sdl1.addDosojin(dosojin);
    });

    xtest('throw circuit error when dosojin name already exists in registry', async () => {
        expect(sdl2.addDosojin(dosojin)).toThrow();
        expect(sdl2.addDosojin(dosojin)).toMatchObject({
            circuit: circuitName,
            message: `Dosojin with name dosojin already registered by Circuit ${circuitName}`,
            name: 'CircuitError'
        });
    });

    test('register new dosojin when dosojin name does not exist in registry', async () => {
        const anotherDosojin: Dosojin = new Dosojin('anotherDosojin');

        sdl2.addDosojin(anotherDosojin);

        expect(circuit.getRegistry()).toMatchObject({
            'anotherDosojin': true,
            'dosojin': true
        });
    });
}