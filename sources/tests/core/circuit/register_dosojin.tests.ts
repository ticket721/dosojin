import {
    Circuit,
    Dosojin,
} from '../../../core';
import { RegistryLayerMock } from '../../../mocks/layer/RegistryLayerMock';

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
    });

    test('throw circuit error when dosojin name already exists in registry', async () => {
        await sdl1.addDosojin(dosojin);

        await expect(sdl2.addDosojin(dosojin)).rejects.toThrow();
        await expect(sdl2.addDosojin(dosojin)).rejects.toMatchObject({
            circuit: circuitName,
            message: `Dosojin with name dosojin already registered by Circuit ${circuitName}`,
            name: 'CircuitError',
        });
    });

    test('register new dosojin when dosojin name does not exist in registry', async () => {
        await sdl1.addDosojin(dosojin);

        const anotherDosojin: Dosojin = new Dosojin('anotherDosojin');

        await sdl2.addDosojin(anotherDosojin);

        expect(circuit.getRegistry()).toMatchObject({
            'anotherDosojin': true,
            'dosojin': true,
        });
    });
}
